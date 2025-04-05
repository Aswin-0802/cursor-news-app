import { createStore } from 'vuex'
import Parser from 'rss-parser'
import axios from 'axios'

const parser = new Parser({
  customFields: {
    item: [
      'media:content',
      'media:thumbnail',
      'description',
      'content:encoded',
      'enclosure',
      'itunes:image',
      'media:group',
      'media:description'
    ]
  }
})

export default createStore({
  state: {
    feeds: [],
    bookmarks: JSON.parse(localStorage.getItem('bookmarks') || '[]'),
    rssUrls: [
      // Indian News Sources with Media
      'https://www.thehindu.com/news/national/feeder/default.rss',
      'https://www.thehindu.com/sport/feeder/default.rss',
      'https://www.indiatoday.in/rss/1206577',
      'https://www.indiatoday.in/rss/1206513',
      'https://www.deccanherald.com/feeds/india.rss',
      'https://www.deccanherald.com/feeds/sports.rss',
      
      // International News Sources with Media
      'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
      'https://rss.nytimes.com/services/xml/rss/nyt/Sports.xml',
      'https://feeds.bbci.co.uk/news/world/rss.xml',
      'https://feeds.bbci.co.uk/sport/rss.xml',
      
      // Tech News with Media
      'https://feeds.feedburner.com/ndtv-gadgets',
      'https://feeds.feedburner.com/ndtv-latest',
      
      // Business News
      'https://www.moneycontrol.com/rss/business.xml',
      'https://www.moneycontrol.com/rss/economy.xml',
      
      // Entertainment with Media
      'https://www.hollywoodreporter.com/feed/',
      'https://www.bollywoodhungama.com/feed/',
      
      // Video News Sources
      'https://www.youtube.com/feeds/videos.xml?channel_id=UCYfdidRxbB8Qhf0Nx7ioOYw', // NDTV
      'https://www.youtube.com/feeds/videos.xml?channel_id=UCzLqOSZPtUKrmSEnlH4LAvw'  // BBC News
    ]
  },
  mutations: {
    SET_FEEDS(state, feeds) {
      state.feeds = feeds
    },
    ADD_BOOKMARK(state, item) {
      if (!state.bookmarks.some(bookmark => bookmark.guid === item.guid)) {
        state.bookmarks.push(item)
        localStorage.setItem('bookmarks', JSON.stringify(state.bookmarks))
      }
    },
    REMOVE_BOOKMARK(state, guid) {
      state.bookmarks = state.bookmarks.filter(item => item.guid !== guid)
      localStorage.setItem('bookmarks', JSON.stringify(state.bookmarks))
    }
  },
  actions: {
    async fetchFeeds({ commit, state }) {
      try {
        const feedPromises = state.rssUrls.map(async url => {
          try {
            const response = await axios.get(url, {
              headers: {
                'Accept': 'application/rss+xml, application/xml, text/xml; q=0.9, */*;q=0.8',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
              }
            })
            
            const feed = await parser.parseString(response.data)
            return feed.items.map(item => {
              // Extract media content
              const mediaContent = item['media:content'] || item.enclosure
              const mediaGroup = item['media:group']
              const thumbnail = item['media:thumbnail'] || item['itunes:image']
              
              // Determine if it's a video
              const isVideo = mediaContent && 
                (mediaContent.type?.includes('video') || 
                 mediaContent.url?.includes('youtube.com') ||
                 mediaContent.url?.includes('youtu.be'))

              return {
                ...item,
                guid: item.guid || item.link,
                title: item.title || 'No Title',
                content: item.content || item.description || item['content:encoded'] || '',
                contentSnippet: item.contentSnippet || item.description || '',
                media: {
                  type: isVideo ? 'video' : 'image',
                  url: mediaContent?.url || mediaContent?.['$']?.url || mediaGroup?.['media:content']?.[0]?.['$']?.url,
                  thumbnail: thumbnail?.['$']?.url || thumbnail?.href || mediaGroup?.['media:thumbnail']?.[0]?.['$']?.url,
                  description: item['media:description'] || mediaGroup?.['media:description']?.[0] || '',
                  duration: mediaContent?.['$']?.duration || mediaGroup?.['media:content']?.[0]?.['$']?.duration
                },
                pubDate: item.pubDate || item.isoDate || new Date().toISOString()
              }
            })
          } catch (error) {
            console.error(`Error fetching feed from ${url}:`, error)
            return []
          }
        })

        const results = await Promise.all(feedPromises)
        const allItems = results.flat().filter(item => item.title && item.link)
        
        // Sort by date, most recent first
        allItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
        
        commit('SET_FEEDS', allItems)
      } catch (error) {
        console.error('Error fetching feeds:', error)
        throw error
      }
    }
  },
  getters: {
    filteredFeeds: (state) => (searchQuery) => {
      if (!searchQuery) return state.feeds
      const query = searchQuery.toLowerCase()
      return state.feeds.filter(item => 
        item.title.toLowerCase().includes(query) || 
        (item.content && item.content.toLowerCase().includes(query))
      )
    }
  }
}) 