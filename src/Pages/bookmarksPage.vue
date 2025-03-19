<template>
    <v-container class="home-page">
      <!-- Заголовок страницы -->
      <v-row justify="center">
        <v-col cols="12" md="8" lg="6">
          <h1 class="text-center white--text">Мои закладки</h1>
        </v-col>
      </v-row>
  
      <!-- Карточки фильмов -->
      <v-row class="movies-grid">
        <v-col
          v-for="movie in bookmarkedMovies"
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
  
      <!-- Модальное окно с деталями фильма -->
      <v-dialog v-model="isMovieDetailsOpen" max-width="800">
        <v-card v-if="selectedMovie" class="movie-details-modal">
          <!-- Обложка фильма -->
          <v-img :src="selectedMovie.poster" cover class="modal-poster"></v-img>
  
          <!-- Информация о фильме -->
          <v-card-text class="modal-content">
            <v-card-title class="modal-title">{{ selectedMovie.title }}</v-card-title>
            <p><strong>Рейтинг:</strong> {{ selectedMovie.rating }}</p>
            <p><strong>Год выпуска:</strong> {{ selectedMovie.year }}</p>
            <p><strong>Длительность:</strong> {{ selectedMovie.duration }} мин</p>
            <p><strong>Описание:</strong> {{ selectedMovie.description }}</p>
  
            <!-- Трейлер -->
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
  
          <!-- Кнопка закрытия -->
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
      const hoveredMovie = ref(null); // Для отслеживания наведения на фильм
      const isMovieDetailsOpen = ref(false); // Для открытия/закрытия модального окна
      const selectedMovie = ref(null); // Выбранный фильм для отображения деталей
      const currentUser = ref(JSON.parse(localStorage.getItem('user')) || { id: null }); // Загружаем пользователя из localStorage
      const bookmarkedMovies = ref([]); // Список фильмов в закладках
  
      // Получение закладок из API
      const fetchBookmarks = async () => {
  try {
    const response = await fetch(`http://localhost:3000/bookmarks/${currentUser.value.id}`);
    if (response.ok) {
      const data = await response.json();
      console.log("Данные после удаления:", data); // Логирование
      bookmarkedMovies.value = data;
    } else {
      console.error('Ошибка при получении закладок');
    }
  } catch (error) {
    console.error('Ошибка при запросе к серверу:', error);
  }
};
  
      // Удаление фильма из закладок через API
      const removeFromBookmarks = async (movie) => {
        try {
          const response = await fetch(`http://localhost:3000/bookmarks/${movie.id}`, {
            method: 'DELETE',
          });
  
          if (response.ok) {
            console.log('Фильм удален из закладок');
            fetchBookmarks(); // Обновляем список закладок после удаления
          } else {
            console.error('Ошибка при удалении фильма из закладок');
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
        openMovieDetails,
        removeFromBookmarks,
      };
    },
  };
  </script>
  
  <style scoped>
  /* Используйте те же стили, что и в вашем основном компоненте */
  .home-page {
    background-color: #000;
    min-height: 100vh;
    padding: 0;
    max-width: 100vw;
  }
  
  .movies-grid {
    margin: 0;
    padding: 0;
  }
  
  .movie-col {
    padding: 10px;
  }
  
  .movie-card {
    background-color: #000;
    border-radius: 15px;
    overflow: hidden;
    margin: 0;
    padding: 0;
    position: relative;
    cursor: pointer;
  }
  
  .movie-poster {
    position: relative;
    border-radius: 15px;
  }
  
  .movie-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 50%;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0));
    border-radius: 15px;
  }
  
  .movie-title {
    position: absolute;
    bottom: 10px;
    left: 10px;
    color: white;
    font-size: 1.2rem;
    font-weight: bold;
    z-index: 2;
    transition: bottom 0.3s ease;
  }
  
  .movie-title-up {
    bottom: 120px; /* Поднимаем название вверх */
  }
  
  .movie-info {
    position: absolute;
    bottom: -100%;
    left: 0;
    width: 100%;
    background-color: rgba(0, 0, 0, 0.7); /* Полупрозрачный фон */
    color: white;
    padding: 10px;
    transition: bottom 0.3s ease;
    border-radius: 0 0 15px 15px;
  }
  
  .movie-info-visible {
    bottom: 0;
  }
  
  .movie-details-modal {
    background-color: #000;
    color: white;
  }
  
  .modal-poster {
    width: 100%;
    height: auto;
    border-radius: 15px 15px 0 0;
  }
  
  .modal-content {
    padding: 20px;
  }
  
  .modal-title {
    font-size: 2rem;
    margin-bottom: 20px;
  }
  
  .trailer-container {
    margin-top: 20px;
  }
  </style>