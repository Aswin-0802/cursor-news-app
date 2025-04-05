<template>
  <div>
    <h2 class="mb-4">Bookmarked News</h2>
    <div v-if="bookmarks.length === 0" class="alert alert-info">
      No bookmarks yet. Start bookmarking news items from the home page!
    </div>
    <div class="row">
      <div v-for="item in filteredBookmarks" :key="item.guid" class="col-md-4">
        <div class="card">
          <img v-if="item.enclosure && item.enclosure.url" :src="item.enclosure.url" class="card-img-top" alt="News image">
          <div class="card-body">
            <h5 class="card-title">{{ item.title }}</h5>
            <p class="card-text" v-html="item.contentSnippet"></p>
            <div class="d-flex justify-content-between align-items-center">
              <a :href="item.link" target="_blank" class="btn btn-primary">Read More</a>
              <button 
                class="btn btn-outline-danger" 
                @click="removeBookmark(item)"
              >
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapMutations } from 'vuex'

export default {
  name: 'Bookmarks',
  props: {
    searchQuery: {
      type: String,
      default: ''
    }
  },
  computed: {
    ...mapState(['bookmarks']),
    filteredBookmarks() {
      if (!this.searchQuery) return this.bookmarks
      const query = this.searchQuery.toLowerCase()
      return this.bookmarks.filter(item => 
        item.title.toLowerCase().includes(query) || 
        item.content.toLowerCase().includes(query)
      )
    }
  },
  methods: {
    ...mapMutations(['REMOVE_BOOKMARK']),
    removeBookmark(item) {
      this.REMOVE_BOOKMARK(item.guid)
    }
  }
}
</script>

<style scoped>
.card {
  height: 100%;
}

.bi {
  font-size: 1.2rem;
}
</style> 