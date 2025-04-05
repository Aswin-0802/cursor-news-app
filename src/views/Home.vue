<template>
  <div>
    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2">Loading news feeds...</p>
    </div>
    <div v-else-if="error" class="alert alert-warning" role="alert">
      <h4 class="alert-heading">Unable to load news</h4>
      <p>{{ error }}</p>
      <hr>
      <button class="btn btn-primary" @click="retryLoading">Retry Loading</button>
    </div>
    <div v-else-if="filteredItems.length === 0" class="alert alert-info">
      No news items found. Please try again later.
    </div>
    <div v-else class="row">
      <div v-for="item in filteredItems" :key="item.guid" class="col-md-4 mb-4">
        <div class="card h-100">
          <!-- Media Content -->
          <div v-if="item.media && (item.media.url || item.media.thumbnail || item.enclosure?.url)" class="media-container">
            <!-- Video Content -->
            <div v-if="item.media?.type === 'video'" class="video-wrapper">
              <iframe
                v-if="isYouTubeUrl(item.media.url)"
                :src="getYouTubeEmbedUrl(item.media.url)"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
              ></iframe>
              <video
                v-else
                :src="item.media.url"
                controls
                class="w-100"
              ></video>
            </div>
            <!-- Image Content -->
            <img
              v-else
              :src="item.media?.url || item.media?.thumbnail || item.enclosure?.url"
              class="card-img-top"
              alt="News image"
              @error="handleImageError"
            >
          </div>
          <div class="card-body">
            <h5 class="card-title">{{ item.title }}</h5>
            <p class="card-text" v-html="item.contentSnippet || item.content"></p>
            <div class="d-flex justify-content-between align-items-center mt-auto">
              <a :href="item.link" target="_blank" class="btn btn-primary">Read More</a>
              <button 
                class="btn btn-outline-secondary" 
                @click="toggleBookmark(item)"
                :class="{ 'active': isBookmarked(item) }"
              >
                <i class="bi" :class="isBookmarked(item) ? 'bi-bookmark-fill' : 'bi-bookmark'"></i>
              </button>
            </div>
          </div>
          <div class="card-footer text-muted">
            <small>
              {{ formatDate(item.pubDate || item.isoDate) }}
              <span v-if="item.creator" class="ms-2">by {{ item.creator }}</span>
              <span v-if="item.media.duration" class="ms-2">
                <i class="bi bi-clock"></i> {{ formatDuration(item.media.duration) }}
              </span>
            </small>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapMutations } from 'vuex'

export default {
  name: 'Home',
  props: {
    searchQuery: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      loading: true,
      error: null
    }
  },
  computed: {
    ...mapState(['feeds', 'bookmarks']),
    ...mapGetters(['filteredFeeds']),
    filteredItems() {
      return this.filteredFeeds(this.searchQuery)
    }
  },
  methods: {
    ...mapMutations(['ADD_BOOKMARK', 'REMOVE_BOOKMARK']),
    isBookmarked(item) {
      return this.bookmarks.some(bookmark => bookmark.guid === item.guid)
    },
    toggleBookmark(item) {
      if (this.isBookmarked(item)) {
        this.REMOVE_BOOKMARK(item.guid)
      } else {
        this.ADD_BOOKMARK(item)
      }
    },
    formatDate(dateString) {
      if (!dateString) return ''
      try {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      } catch (e) {
        return dateString
      }
    },
    formatDuration(duration) {
      if (!duration) return ''
      const minutes = Math.floor(duration / 60)
      const seconds = duration % 60
      return `${minutes}:${seconds.toString().padStart(2, '0')}`
    },
    handleImageError(e) {
      e.target.style.display = 'none'
    },
    isYouTubeUrl(url) {
      return url.includes('youtube.com') || url.includes('youtu.be')
    },
    getYouTubeEmbedUrl(url) {
      const videoId = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/)?.[1]
      return `https://www.youtube.com/embed/${videoId}`
    },
    async retryLoading() {
      this.error = null
      this.loading = true
      try {
        await this.$store.dispatch('fetchFeeds')
        this.loading = false
      } catch (error) {
        this.error = 'Unable to load news feeds. Please check your internet connection and try again.'
        this.loading = false
      }
    }
  },
  async created() {
    try {
      this.loading = true
      await this.$store.dispatch('fetchFeeds')
      this.loading = false
    } catch (error) {
      this.error = 'Unable to load news feeds. Please check your internet connection and try again.'
      this.loading = false
    }
  }
}
</script>

<style scoped>
.card {
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease-in-out;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.media-container {
  position: relative;
  width: 100%;
  padding-top: 56.25%; /* 16:9 Aspect Ratio */
  background-color: #f8f9fa;
}

.media-container img,
.media-container video,
.media-container iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.btn-outline-secondary.active {
  background-color: #6c757d;
  color: white;
}

.bi {
  font-size: 1.2rem;
}

.card-text {
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.alert {
  margin-top: 2rem;
  text-align: center;
}
</style> 