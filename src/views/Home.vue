<template>
  <div>
    <div v-if="error" class="alert alert-warning" role="alert">
      <h4 class="alert-heading">Unable to load news</h4>
      <p>{{ error }}</p>
      <hr>
      <button class="btn btn-primary" @click="retryLoading">Retry Loading</button>
    </div>
    <div v-if="loading" class="loader-container">
      <div class="infinity-loader">
        <div class="infinity-path">
          <div class="infinity-circle"></div>
          <div class="infinity-circle"></div>
        </div>
      </div>
      <p class="loading-text">Loading news feeds...</p>
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
      error: null,
      loading: true
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
      } catch (error) {
        this.error = 'Unable to load news feeds. Please check your internet connection and try again.'
      } finally {
        this.loading = false
      }
    }
  },
  async created() {
    this.loading = true
    try {
      await this.$store.dispatch('fetchFeeds')
    } catch (error) {
      this.error = 'Unable to load news feeds. Please check your internet connection and try again.'
    } finally {
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
  max-height: 400px;
  overflow: hidden;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0.75rem;
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.media-container {
  position: relative;
  width: 100%;
  padding-top: 40%; /* Reduced aspect ratio */
  background-color: #f8f9fa;
  overflow: hidden;
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

.card-text {
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
  color: var(--text-muted);
}

.card-footer {
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
}

.btn {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.row {
  margin: -0.5rem;
}

.col-md-4 {
  padding: 0.5rem;
}

.alert {
  margin-top: 1rem;
  text-align: center;
}

.bi {
  font-size: 1rem;
}

@media (min-width: 768px) {
  .col-md-4 {
    flex: 0 0 33.333333%;
    max-width: 33.333333%;
  }
}

@media (min-width: 992px) {
  .col-md-4 {
    flex: 0 0 25%;
    max-width: 25%;
  }
}

.loader-container {
  text-align: center;
  padding: 2rem;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.loading-text {
  margin-top: 1rem;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.infinity-loader {
  position: relative;
  width: 80px;
  height: 40px;
  margin: 0 auto;
}

.infinity-path {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 40px;
}

.infinity-circle {
  position: absolute;
  width: 20px;
  height: 20px;
  background: #0d6efd;
  border-radius: 50%;
  animation: infinity-animation 2s ease-in-out infinite;
}

.infinity-circle:nth-child(2) {
  animation-delay: -1s;
}

@keyframes infinity-animation {
  0% {
    left: 0;
    transform: translateX(0) scale(1);
  }
  25% {
    transform: translateX(20px) scale(0.8);
  }
  50% {
    left: 60px;
    transform: translateX(-20px) scale(1);
  }
  75% {
    transform: translateX(-40px) scale(0.8);
  }
  100% {
    left: 0;
    transform: translateX(0) scale(1);
  }
}
</style> 