<template>
  <v-container class="home-page">
    <!-- Заголовок страницы -->
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <h1 class="text-center white--text">Мои закладки</h1>
      </v-col>
    </v-row>

    <!-- Поисковая строка -->
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-card class="search-card">
          <v-text-field
            v-model="searchQuery"
            label="Поиск в закладках"
            solo
            flat
            hide-details
            clearable
            prepend-inner-icon="mdi-magnify"
            @input="applyFilters"
          ></v-text-field>
        </v-card>
      </v-col>
    </v-row>

    <!-- Фильтры по году и жанру -->
    <v-row justify="center" class="filters-row">
      <v-col cols="12" sm="6" md="4" lg="3">
        <v-select
          v-model="selectedYear"
          :items="yearOptions"
          label="Год выпуска"
          clearable
          @update:modelValue="applyFilters"
        ></v-select>
      </v-col>
      <v-col cols="12" sm="6" md="4" lg="3">
        <v-select
          v-model="selectedGenre"
          :items="genreOptions"
          label="Жанр"
          clearable
          @update:modelValue="applyFilters"
        ></v-select>
      </v-col>
    </v-row>

    <!-- Карточки фильмов -->
    <v-row class="movies-grid">
      <v-col
        v-for="movie in filteredBookmarks"
        :key="movie.id"
        cols="12"
        sm="4"
        md="4"
        lg="4"
        class="movie-col"
      >
        <v-card class="movie-card" @click="openMovieDetails(movie)" @mouseenter="hoveredMovie = movie.id" @mouseleave="hoveredMovie = null">
          <v-img
            :src="movie.poster"
            height="300"
            cover
            class="movie-poster"
          >
            <div class="movie-overlay"></div>
            <v-card-title class="movie-title" :class="{ 'movie-title-up': hoveredMovie === movie.id }">
              {{ movie.title }}
            </v-card-title>
            <div class="movie-info" :class="{ 'movie-info-visible': hoveredMovie === movie.id }">
              <p><strong>Описание:</strong> {{ movie.description }}</p>
              <p><strong>Рейтинг:</strong> {{ movie.rating }}</p>
              <p><strong>Год:</strong> {{ movie.year }}</p>
              <v-btn color="grey" @click.stop="removeFromBookmarks(movie)">Удалить из закладок</v-btn>
            </div>
          </v-img>
        </v-card>
      </v-col>
    </v-row>

    <!-- Сообщение, если закладок нет или фильмы не найдены -->
    <v-row v-if="bookmarkedMovies.length === 0" justify="center">
      <v-col cols="12" class="text-center">
        <v-alert type="info">
          У вас пока нет закладок. Добавьте фильмы, чтобы они отображались здесь.
        </v-alert>
      </v-col>
    </v-row>
    <v-row v-else-if="filteredBookmarks.length === 0" justify="center">
      <v-col cols="12" class="text-center">
        <v-alert type="info">
          Фильмы по вашему запросу не найдены. Попробуйте изменить параметры поиска.
        </v-alert>
      </v-col>
    </v-row>

    <!-- Модальное окно с деталями фильма -->
    <v-dialog v-model="isMovieDetailsOpen" max-width="800">
      <v-card v-if="selectedMovie" class="movie-details-modal">
        <v-img :src="selectedMovie.poster" cover class="modal-poster"></v-img>
        <v-card-text class="modal-content">
          <v-card-title class="modal-title">{{ selectedMovie.title }}</v-card-title>
          <p><strong>Рейтинг:</strong> {{ selectedMovie.rating }}</p>
          <p><strong>Год выпуска:</strong> {{ selectedMovie.year }}</p>
          <p><strong>Длительность:</strong> {{ selectedMovie.duration }} мин</p>
          <p><strong>Описание:</strong> {{ selectedMovie.description }}</p>

          <div class="trailer-container">
            <iframe
              width="100%"
              height="405"
              :src="selectedMovie.trailer"
              frameborder="0"
              allow="clipboard-write; autoplay"
              allowfullscreen
            ></iframe>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" @click="isMovieDetailsOpen = false">Закрыть</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { ref, computed, onMounted } from 'vue';

export default {
  setup() {
    const hoveredMovie = ref(null);
    const isMovieDetailsOpen = ref(false);
    const selectedMovie = ref(null);
    const currentUser = ref(JSON.parse(localStorage.getItem('user')) || { id: null });
    const bookmarkedMovies = ref([]);
    
    // Фильтры и поиск
    const searchQuery = ref('');
    const selectedYear = ref(null);
    const selectedGenre = ref(null);

    // Получение закладок из API
    const fetchBookmarks = async () => {
      try {
        const response = await fetch(`http://localhost:3000/bookmarks/${currentUser.value.id}`);
        if (response.ok) {
          bookmarkedMovies.value = await response.json();
        } else {
          console.error('Ошибка при получении закладок');
        }
      } catch (error) {
        console.error('Ошибка при запросе к серверу:', error);
      }
    };

    // Опции для фильтров
    const yearOptions = computed(() => {
      const years = [...new Set(bookmarkedMovies.value.map(movie => movie.year))];
      return years.sort((a, b) => b - a).map(year => ({
        title: year.toString(),
        value: year
      }));
    });

    const genreOptions = computed(() => {
      const allGenres = bookmarkedMovies.value.flatMap(movie => movie.genres || []);
      const uniqueGenres = [...new Set(allGenres)];
      return uniqueGenres.sort().map(genre => ({
        title: genre,
        value: genre
      }));
    });

    // Фильтрация закладок
    const filteredBookmarks = computed(() => {
      let filtered = bookmarkedMovies.value;
      
      // Фильтрация по поисковому запросу
      if (searchQuery.value) {
        filtered = filtered.filter(movie =>
          movie.title.toLowerCase().includes(searchQuery.value.toLowerCase())
        );
      }
      
      // Фильтрация по году
      if (selectedYear.value) {
        filtered = filtered.filter(movie => movie.year === selectedYear.value);
      }
      
     
      
      return filtered;
    });

    const applyFilters = () => {
      // Просто для обновления computed свойства
    };

    // Удаление фильма из закладок через API
    const removeFromBookmarks = async (movie) => {
      try {
        const response = await fetch(`http://localhost:3000/bookmarks/${movie.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: currentUser.value.id,
          }),
        });

        if (response.ok) {
          fetchBookmarks(); // Обновляем список закладок после удаления
        }
      } catch (error) {
        console.error('Ошибка при запросе к серверу:', error);
      }
    };

    // Открытие деталей фильма
    const openMovieDetails = (movie) => {
      selectedMovie.value = movie;
      isMovieDetailsOpen.value = true;
    };

    // При монтировании компонента загружаем закладки
    onMounted(() => {
      fetchBookmarks();
    });

    return {
      hoveredMovie,
      isMovieDetailsOpen,
      selectedMovie,
      bookmarkedMovies,
      filteredBookmarks,
      searchQuery,
      selectedYear,
      selectedGenre,
      yearOptions,
      genreOptions,
      openMovieDetails,
      removeFromBookmarks,
      applyFilters
    };
  },
};
</script>

<style scoped>
.home-page {
  background-color: #0f0f13;
  min-height: 100vh;
  padding: 0px;
  max-width: 100vw;
}

.search-card {
  background-color: #1a1a23;
  border-radius: 12px;
  padding: 12px;
  margin-top: 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.filters-row {
  margin-top: 20px;
  margin-bottom: 25px;
}

.v-select {
  background-color: #1a1a23;
  border-radius: 10px;
}

.v-select :deep(.v-field__outline) {
  color: #3a3a4a;
}

.v-select :deep(.v-field__input) {
  color: #f0f0f5;
}

.v-select :deep(.v-label) {
  color: #a0a0b0;
}

.movies-grid {
  margin: 0 -8px;
  padding: 0;
}

.movie-col {
  padding: 8px;
}

.movie-card {
  background-color: #1a1a23;
  border-radius: 14px;
  overflow: hidden;
  margin: 0;
  padding: 0;
  position: relative;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  border: 1px solid #2a2a35;
}

.movie-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 20px rgba(0, 0, 0, 0.3);
  border-color: #6c5ce7;
}

.movie-poster {
  position: relative;
  border-radius: 14px;
  transition: transform 0.4s ease;
}

.movie-card:hover .movie-poster {
  transform: scale(1.04);
}

.movie-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 50%;
  background: linear-gradient(to top, rgba(15, 15, 19, 0.95), transparent);
  border-radius: 14px;
}

.movie-title {
  position: absolute;
  bottom: 16px;
  left: 16px;
  right: 16px;
  color: white;
  font-size: 1.15rem;
  font-weight: 600;
  z-index: 2;
  transition: all 0.3s ease;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.movie-title-up {
  left: 240px;
}

.movie-info {
  position: absolute;
  bottom: -100%;
  left: 0;
  width: 100%;
  background-color: #1a1a23;
  color: #e0e0e8;
  padding: 18px;
  transition: bottom 0.35s ease-out;
  border-radius: 0 0 14px 14px;
  font-size: 0.92rem;
  line-height: 1.5;
  border-top: 1px solid #2a2a35;
}

.movie-info p {
  margin-bottom: 10px;
}

.movie-info strong {
  color: #a78bfa;
}

.movie-info-visible {
  bottom: 0;
}

.movie-details-modal {
  background-color: #1a1a23;
  color: #e0e0e8;
}

.modal-poster {
  width: 100%;
  height: auto;
  border-radius: 14px 14px 0 0;
}

.modal-content {
  padding: 28px;
}

.modal-title {
  font-size: 2.4rem;
  margin-bottom: 28px;
  color: white;
  font-weight: 600;
  letter-spacing: -0.5px;
}

.trailer-container {
  margin-top: 28px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.v-alert {
  border-radius: 10px;
  background-color: #21212b;
  color: #f0f0f5;
  border: 1px solid #2a2a35;
}

.v-alert--variant-elevated {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.v-btn {
  text-transform: none;
  font-weight: 500;
  letter-spacing: 0.3px;
}

.v-btn--variant-elevated {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  background-color: #6c5ce7;
  color: white;
}

.v-btn--variant-elevated:hover {
  background-color: #5d4aec;
}

.v-text-field :deep(.v-field) {
  background-color: #21212b;
  border-radius: 10px;
}

.v-text-field :deep(.v-field__input) {
  color: #f0f0f5;
}

.v-text-field :deep(.v-label) {
  color: #a0a0b0;
}

.v-dialog .v-card {
  border-radius: 14px;
  overflow: hidden;
}

.white--text {
  color: white;
}

.text-center {
  text-align: center;
}
</style>