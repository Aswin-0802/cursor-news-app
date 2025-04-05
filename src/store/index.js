import { createStore } from 'vuex'
import axios from 'axios'

export default createStore({
  state: {
    feeds: [],
    bookmarks: JSON.parse(localStorage.getItem('bookmarks') || '[]'),
    rssUrls: [
      // Indian News Sources
      'https://timesofindia.indiatimes.com/rssfeedstopstories.cms',
      'https://timesofindia.indiatimes.com/rssfeeds/296589292.cms', // Sports
      'https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml',
      'https://www.hindustantimes.com/feeds/rss/sports/rssfeed.xml',
      
      // International News Sources
      'https://feeds.bbci.co.uk/news/world/rss.xml',
      'https://feeds.bbci.co.uk/sport/rss.xml',
      
      // Tech News
      'https://www.techradar.com/rss',
      'https://www.digitaltrends.com/feed/',
      
      // Entertainment
      'https://www.rollingstone.com/feed/',
      'https://www.billboard.com/feed/'
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
            // Use a different CORS proxy
            const proxyUrl = 'https://api.allorigins.win/raw?url='
            const targetUrl = proxyUrl + encodeURIComponent(url)

            const response = await axios.get(targetUrl, {
              headers: {
                'Accept': 'application/rss+xml, application/xml, text/xml; q=0.9, */*;q=0.8'
              },
              timeout: 15000 // 15 second timeout
            })
            
            if (!response.data) {
              console.warn(`Empty response from ${url}`)
              return []
            }

            // Parse the XML response
            const parser = new DOMParser()
            const xmlDoc = parser.parseFromString(response.data, "text/xml")
            
            // Get all items
            const items = xmlDoc.getElementsByTagName("item")
            if (!items || items.length === 0) {
              console.warn(`No items found in feed from ${url}`)
              return []
            }

            return Array.from(items).map(item => {
              const title = item.getElementsByTagName("title")[0]?.textContent || 'No Title'
              const link = item.getElementsByTagName("link")[0]?.textContent || ''
              const description = item.getElementsByTagName("description")[0]?.textContent || ''
              const pubDate = item.getElementsByTagName("pubDate")[0]?.textContent || new Date().toISOString()
              
              // Extract media content
              const enclosure = item.getElementsByTagName("enclosure")[0]
              const mediaContent = enclosure ? {
                url: enclosure.getAttribute("url"),
                type: enclosure.getAttribute("type")
              } : null

              // Extract thumbnail
              const mediaThumbnail = item.getElementsByTagName("media:thumbnail")[0]
              const thumbnail = mediaThumbnail ? mediaThumbnail.getAttribute("url") : null

              return {
                guid: link,
                title,
                link,
                content: description,
                contentSnippet: description,
                media: {
                  type: mediaContent?.type?.includes('video') ? 'video' : 'image',
                  url: mediaContent?.url,
                  thumbnail: thumbnail,
                  description: description
                },
                pubDate
              }
            })
          } catch (error) {
            console.error(`Error fetching feed from ${url}:`, error.message)
            return []
          }
        })

        const results = await Promise.all(feedPromises)
        const allItems = results.flat().filter(item => item && item.title && item.link)
        
        if (allItems.length === 0) {
          console.warn('No valid feed items found from any source')
        } else {
          console.log(`Successfully fetched ${allItems.length} news items`)
        }
        
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