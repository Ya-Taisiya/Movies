<template>
  <v-container class="home-page">
    <!-- Кнопка для открытия модального окна -->
    <v-btn class="auth-button" @click="handleAuthButtonClick">
      {{ isAuthenticated ? 'Выйти' : 'Авторизация' }}
    </v-btn>

    <!-- Поисковая строка -->
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-card class="search-card">
          <v-text-field
            v-model="searchQuery"
            label="Что вы хотите посмотреть?"
            solo
            flat
            hide-details
            clearable
            prepend-inner-icon="mdi-card-search"
            @input="searchMovies"
          ></v-text-field>
        </v-card>
      </v-col>
    </v-row>

    <!-- Карточки фильмов -->
    <v-row class="movies-grid">
      <v-col
        v-for="movie in paginatedMovies"
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
              <v-btn color="grey" @click.stop="addToBookmarks(movie)">Добавить в закладки</v-btn>
            </div>
          </v-img>
        </v-card>
      </v-col>
    </v-row>

    <!-- Пагинация -->
    <v-row>
      <v-col cols="12">
        <v-pagination
          v-model="currentPage"
          :length="totalPages"
          :total-visible="7"
          @update:modelValue="handlePageChange"
          color="white"
        ></v-pagination>
      </v-col>
    </v-row>

    <!-- Модальное окно с деталями фильма -->
    <v-dialog v-model="isMovieDetailsOpen" max-width="800">
      <v-card v-if="selectedMovie" class="movie-details-modal">
        <v-img :src="selectedMovie.poster" cover class="modal-poster"></v-img>
        <v-card-text class="modal-content">
          <v-card-title class="modal-title">{{ selectedMovie.title }}</v-card-title>
          
          <!-- Блок с рейтингом -->
          <div class="rating-section mb-6">
            <h3 class="mb-2">Рейтинг фильма</h3>
            <div class="d-flex align-center mb-2">
              <v-rating
                :model-value="averageRating"
                readonly
                color="amber"
                background-color="grey darken-1"
                density="comfortable"
                size="large"
                half-increments
                class="custom-rating"
              ></v-rating>
              <span class="ml-2">{{ averageRating }} ({{ ratingCount }} оценок)</span>
            </div>
            
            <h4 class="mb-2">Ваша оценка</h4>
            <div v-if="isAuthenticated">
              <v-rating
                v-model="userRating"
                color="amber"
                background-color="grey darken-1"
                density="comfortable"
                size="large"
                @update:modelValue="handleRatingChange"
                class="custom-rating"
              ></v-rating>
              <p v-if="userRating > 0" class="mt-1 mb-0">Вы оценили на {{ userRating }} звезд</p>
            </div>
            <div v-else>
              <v-alert type="info" density="compact">
                Чтобы оценить фильм, пожалуйста <a href="#" @click.prevent="isAuthModalOpen = true">авторизуйтесь</a>
              </v-alert>
            </div>
          </div>

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

          <!-- Секция отзывов -->
          <v-divider class="my-4"></v-divider>
          <h3 class="mb-4">Отзывы</h3>

          <!-- Список отзывов -->
          <div v-if="reviews.length > 0" class="reviews-list">
            <v-card v-for="review in reviews" :key="review.id" class="mb-3 pa-3">
              <div class="d-flex justify-space-between align-center">
                <strong>{{ review.user_name }}</strong>
                <v-rating
                  :model-value="review.rating"
                  readonly
                  color="amber"
                  density="compact"
                  size="small"
                  half-increments
                ></v-rating>
              </div>
              <p class="mt-2 mb-0">{{ review.comment }}</p>
              <small class="text-grey">{{ formatDate(review.created_at) }}</small>
            </v-card>
          </div>
          <p v-else class="text-grey">Пока нет отзывов. Будьте первым!</p>

          <!-- Форма для добавления отзыва -->
          <div v-if="isAuthenticated" class="add-review mt-6">
            <h4 class="mb-3">Оставить отзыв</h4>
            <v-form @submit.prevent="submitReview">
              <v-rating
                v-model="userRating"
                color="amber"
                background-color="grey darken-1"
                density="comfortable"
                size="large"
                class="mb-3"
                @update:modelValue="handleRatingChange"
              ></v-rating>
              <v-textarea
                v-model="newReview.comment"
                label="Ваш отзыв"
                class="mt-2"
                rows="3"
                no-resize
              ></v-textarea>
              <v-btn type="submit" color="primary">Отправить</v-btn>
            </v-form>
          </div>
          <div v-else class="auth-required mt-6">
            <v-alert type="info">
              Чтобы оставить отзыв, пожалуйста <a href="#" @click.prevent="isAuthModalOpen = true">авторизуйтесь</a>
            </v-alert>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" @click="isMovieDetailsOpen = false">Закрыть</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Модальное окно для авторизации и регистрации -->
    <v-dialog v-model="isAuthModalOpen" max-width="500">
      <v-card>
        <v-tabs v-model="authTab">
          <v-tab value="login">Авторизация</v-tab>
          <v-tab value="register">Регистрация</v-tab>
        </v-tabs>
        <v-card-text>
          <!-- Форма авторизации -->
          <v-form v-if="authTab === 'login'" @submit.prevent="login">
            <v-text-field v-model="loginData.username" label="Логин" required></v-text-field>
            <v-text-field v-model="loginData.password" label="Пароль" type="password" required></v-text-field>
            <v-btn type="submit" color="primary">Войти</v-btn>
          </v-form>

          <!-- Форма регистрации -->
          <v-form v-if="authTab === 'register'" @submit.prevent="register">
            <v-text-field v-model="registerData.username" label="Логин" required></v-text-field>
            <v-text-field v-model="registerData.password" label="Пароль" type="password" required></v-text-field>
            <v-btn type="submit" color="primary">Зарегистрироваться</v-btn>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { ref, computed, onMounted } from 'vue';

export default {
  setup() {
    const searchQuery = ref('');
    const currentPage = ref(1);
    const moviesPerPage = 9;
    const hoveredMovie = ref(null);
    const isMovieDetailsOpen = ref(false);
    const selectedMovie = ref(null);
    const isAuthenticated = ref(false);
    const isAuthModalOpen = ref(false);
    const authTab = ref('login');
    const loginData = ref({ username: '', password: '' });
    const registerData = ref({ username: '', password: '' });
    const currentUser = ref(null);
    const reviews = ref([]);
    const newReview = ref({
      comment: ''
    });
    const userRating = ref(0);
    const averageRating = ref(0);
    const ratingCount = ref(0);

    // Массив фильмов с обложками
    const movies = [
    {
        id: 1,
        title: "Один дома",
        poster: "https://st.kp.yandex.net/images/film_big/8124.jpg",
        year: 1990,
        rating: 8.1,
        duration: 103,
        description: "Комедия о мальчике, оставшемся дома один на Рождество.",
        trailer: "https://rutube.ru/play/embed/d933451fcf84bf57c8b85d7d92ff591c/",
      },
      {
        id: 2,
        title: "1+1",
        poster: "https://st.kp.yandex.net/images/film_big/535341.jpg",
        year: 2014,
        rating: 8.6,
        duration: 169,
        description: "Фантастический эпос о путешествии через червоточину.",
        trailer: "https://rutube.ru/play/embed/d933451fcf84bf57c8b85d7d92ff591c/",
      },
      {
        id: 3,
        title: "Джентльмены",
        poster: "https://st.kp.yandex.net/images/film_big/1143242.jpg",
        year: 2010,
        rating: 8.7,
        duration: 148,
        description: "Фильм о проникновении в сны.",
        trailer: "https://rutube.ru/play/embed/d933451fcf84bf57c8b85d7d92ff591c/",
      },
      {
        id: 4,
        title: "Волк с Уолл-Стрит",
        poster: "https://st.kp.yandex.net/images/film_big/462682.jpg",
        year: 2019,
        rating: 8.4,
        duration: 122,
        description: "История становления Джокера.",
        trailer: "https://rutube.ru/play/embed/d933451fcf84bf57c8b85d7d92ff591c/",
      },
      {
        id: 5,
        title: "Пираты Карибского моря",
        poster: "https://st.kp.yandex.net/images/film_big/4374.jpg",
        year: 2003,
        rating: 8.3,
        duration: 143,
        description: "Приключения капитана Джека Воробья.",
        trailer: "https://rutube.ru/play/embed/d933451fcf84bf57c8b85d7d92ff591c/",
      },
      {
        id: 6,
        title: "Брат 2",
        poster: "https://st.kp.yandex.net/images/film_big/41520.jpg",
        year: 2000,
        rating: 8.6,
        duration: 155,
        description: "Эпическая история о римском генерале.",
        trailer: "https://ok.ru/video/721308026115",
      },
      {
        id: 7,
        title: "Достать Ножи",
        poster: "https://st.kp.yandex.net/images/film_big/1188529.jpg",
        year: 2001,
        rating: 8.7,
        duration: 178,
        description: "Первая часть трилогии о Средиземье.",
        trailer: "https://rutube.ru/play/embed/d933451fcf84bf57c8b85d7d92ff591c/",
      },
      {
        id: 8,
        title: "Гарри Поттер и философский камень",
        poster: "https://st.kp.yandex.net/images/film_big/689.jpg",
        year: 2001,
        rating: 8.7,
        duration: 178,
        description: "Первая часть трилогии о Средиземье.",
        trailer: "https://rutube.ru/play/embed/d933451fcf84bf57c8b85d7d92ff591c/",
      },
      {
        id: 9,
        title: "Интерстеллар",
        poster: "https://st.kp.yandex.net/images/film_big/258687.jpg",
        year: 2001,
        rating: 8.7,
        duration: 178,
        description: "Первая часть трилогии о Средиземье.",
        trailer: "https://rutube.ru/play/embed/d933451fcf84bf57c8b85d7d92ff591c/",
      },
      {
        id: 10,
        title: "Игра престолов",
        poster: "https://st.kp.yandex.net/images/film_big/464963.jpg",
        year: 2001,
        rating: 8.7,
        duration: 178,
        description: "Первая часть трилогии о Средиземье.",
        trailer: "https://rutube.ru/play/embed/d933451fcf84bf57c8b85d7d92ff591c/",
      },
      {
        id: 11,
        title: "Зеленая миля",
        poster: "https://st.kp.yandex.net/images/film_big/435.jpg",
        year: 2001,
        rating: 8.7,
        duration: 178,
        description: "Первая часть трилогии о Средиземье.",
        trailer: "https://rutube.ru/play/embed/d933451fcf84bf57c8b85d7d92ff591c/",
      },
      {
        id: 12,
        title: "Иван Васильвеич меняет профессию",
        poster: "https://st.kp.yandex.net/images/film_big/42664.jpg",
        year: 2001,
        rating: 8.7,
        duration: 178,
        description: "Первая часть трилогии о Средиземье.",
        trailer: "https://rutube.ru/play/embed/d933451fcf84bf57c8b85d7d92ff591c/",
      },
      {
        id: 13,
        title: "Зверополис",
        poster: "https://st.kp.yandex.net/images/film_big/775276.jpg",
        year: 2001,
        rating: 8.7,
        duration: 178,
        description: "Первая часть трилогии о Средиземье.",
        trailer: "https://rutube.ru/play/embed/d933451fcf84bf57c8b85d7d92ff591c/",
      },
      {
        id: 14,
        title: "Побег из шоушенка",
        poster: "https://st.kp.yandex.net/images/film_big/326.jpg",
        year: 2001,
        rating: 8.7,
        duration: 178,
        description: "Первая часть трилогии о Средиземье.",
        trailer: "https://rutube.ru/play/embed/d933451fcf84bf57c8b85d7d92ff591c/",
      },
      {
        id: 15,
        title: "Начало",
        poster: "https://st.kp.yandex.net/images/film_big/447301.jpg",
        year: 2001,
        rating: 8.7,
        duration: 178,
        description: "Первая часть трилогии о Средиземье.",
        trailer: "https://rutube.ru/play/embed/d933451fcf84bf57c8b85d7d92ff591c/",
      },
      {
        id: 16,
        title: "Аватар",
        poster: "https://st.kp.yandex.net/images/film_big/251733.jpg",
        year: 2001,
        rating: 8.7,
        duration: 178,
        description: "Первая часть трилогии о Средиземье.",
        trailer: "https://rutube.ru/play/embed/d933451fcf84bf57c8b85d7d92ff591c/",
      },
      {
        id: 17,
        title: "Брат",
        poster: "https://st.kp.yandex.net/images/film_big/41519.jpg",
        year: 2001,
        rating: 8.7,
        duration: 178,
        description: "Первая часть трилогии о Средиземье.",
        trailer: "https://rutube.ru/play/embed/d933451fcf84bf57c8b85d7d92ff591c/",
      },
      {
        id: 18,
        title: "Гнев человеческий",
        poster: "https://st.kp.yandex.net/images/film_big/1318972.jpg",
        year: 2001,
        rating: 8.7,
        duration: 178,
        description: "Первая часть трилогии о Средиземье.",
        trailer: "https://rutube.ru/play/embed/d933451fcf84bf57c8b85d7d92ff591c/",
      }
    ];

    const filteredMovies = computed(() => {
      let filtered = movies;
      if (searchQuery.value) {
        filtered = filtered.filter(movie =>
          movie.title.toLowerCase().includes(searchQuery.value.toLowerCase())
        );
      }
      return filtered;
    });

    const totalPages = computed(() => Math.ceil(filteredMovies.value.length / moviesPerPage));
    const paginatedMovies = computed(() => {
      const start = (currentPage.value - 1) * moviesPerPage;
      const end = start + moviesPerPage;
      return filteredMovies.value.slice(start, end);
    });

    const handlePageChange = (page) => {
      currentPage.value = page;
    };

    const searchMovies = () => {
      currentPage.value = 1;
    };

    const handleRatingChange = (rating) => {
      userRating.value = rating;
      submitRating(rating);
    };

    const openMovieDetails = async (movie) => {
      selectedMovie.value = movie;
      isMovieDetailsOpen.value = true;
      await fetchReviews(movie.id);
      await fetchMovieRating(movie.id);
      newReview.value = { comment: '' };
    };

    const fetchReviews = async (movieId) => {
      try {
        const response = await fetch(`http://localhost:3000/reviews/${movieId}`);
        if (response.ok) {
          reviews.value = await response.json();
        } else {
          reviews.value = [];
        }
      } catch (error) {
        console.error('Ошибка при получении отзывов:', error);
        reviews.value = [];
      }
    };

    const fetchMovieRating = async (movieId) => {
      try {
        const ratingResponse = await fetch(`http://localhost:3000/movies/${movieId}/rating`);
        if (ratingResponse.ok) {
          const ratingData = await ratingResponse.json();
          averageRating.value = parseFloat(ratingData.average_rating).toFixed(1);
          ratingCount.value = ratingData.rating_count;
        }
        
        if (isAuthenticated.value) {
          const userRatingResponse = await fetch(`http://localhost:3000/ratings/check?user_id=${currentUser.value.id}&movie_id=${movieId}`);
          if (userRatingResponse.ok) {
            const userRatingData = await userRatingResponse.json();
            userRating.value = userRatingData ? userRatingData.rating : 0;
          }
        }
      } catch (error) {
        console.error('Ошибка при получении рейтинга:', error);
      }
    };

    const submitRating = async (rating) => {
      if (!isAuthenticated.value) {
        isAuthModalOpen.value = true;
        return;
      }
      
      try {
        const response = await fetch('http://localhost:3000/ratings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: currentUser.value.id,
            movie_id: selectedMovie.value.id,
            rating: rating
          }),
        });

        if (response.ok) {
          await fetchMovieRating(selectedMovie.value.id);
        }
      } catch (error) {
        console.error('Ошибка при сохранении оценки:', error);
      }
    };

    const submitReview = async () => {
      if (!userRating.value) {
        alert('Пожалуйста, поставьте оценку');
        return;
      }

      try {
        const response = await fetch('http://localhost:3000/reviews', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            movie_id: selectedMovie.value.id,
            user_id: currentUser.value.id,
            user_name: currentUser.value.username,
            rating: userRating.value,
            comment: newReview.value.comment
          }),
        });

        if (response.ok) {
          await fetchReviews(selectedMovie.value.id);
          newReview.value = { comment: '' };
        }
      } catch (error) {
        console.error('Ошибка при отправке отзыва:', error);
      }
    };

    const formatDate = (dateString) => {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString('ru-RU', options);
    };

    const addToBookmarks = async (movie) => {
      if (!isAuthenticated.value) {
        isAuthModalOpen.value = true;
        return;
      }
      try {
        const response = await fetch('http://localhost:3000/bookmarks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: currentUser.value.id,
            movie_id: movie.id,
            title: movie.title,
            poster: movie.poster,
            year: movie.year,
            rating: movie.rating,
            duration: movie.duration,
          }),
        });
        if (response.ok) {
          console.log('Фильм добавлен в закладки');
        }
      } catch (error) {
        console.error('Ошибка при добавлении в закладки:', error);
      }
    };

    const login = async () => {
      try {
        const response = await fetch('http://localhost:3000/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(loginData.value),
        });
        if (response.ok) {
          const data = await response.json();
          isAuthenticated.value = true;
          isAuthModalOpen.value = false;
          currentUser.value = data.user;
          localStorage.setItem('user', JSON.stringify(data.user));
          if (isMovieDetailsOpen.value && selectedMovie.value) {
            await fetchMovieRating(selectedMovie.value.id);
          }
        }
      } catch (error) {
        console.error('Ошибка при авторизации:', error);
      }
    };

    const register = async () => {
      try {
        const response = await fetch('http://localhost:3000/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(registerData.value),
        });
        if (response.ok) {
          authTab.value = 'login';
        }
      } catch (error) {
        console.error('Ошибка при регистрации:', error);
      }
    };

    const logout = () => {
      isAuthenticated.value = false;
      currentUser.value = null;
      localStorage.removeItem('user');
      userRating.value = 0;
    };

    const handleAuthButtonClick = () => {
      if (isAuthenticated.value) {
        logout();
      } else {
        isAuthModalOpen.value = true;
      }
    };

    onMounted(() => {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user) {
        isAuthenticated.value = true;
        currentUser.value = user;
      }
    });

    return {
      searchQuery,
      currentPage,
      moviesPerPage,
      hoveredMovie,
      isMovieDetailsOpen,
      selectedMovie,
      isAuthenticated,
      isAuthModalOpen,
      authTab,
      loginData,
      registerData,
      currentUser,
      reviews,
      newReview,
      userRating,
      averageRating,
      ratingCount,
      filteredMovies,
      paginatedMovies,
      totalPages,
      handlePageChange,
      searchMovies,
      openMovieDetails,
      addToBookmarks,
      login,
      register,
      logout,
      handleAuthButtonClick,
      submitReview,
      handleRatingChange,
      formatDate
    };
  },
};
</script>

<style scoped>
.home-page {
  background-color: #000;
  min-height: 100vh;
  padding: 0;
  max-width: 100vw;
}

.auth-button {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 1000;
}

.search-card {
  background-color: #333;
  border-radius:5px;
  padding: 5px;
  margin-top: 5px;
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
  bottom: 120px;
}

.movie-info {
  position: absolute;
  bottom: -100%;
  left: 0;
  width: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 10px;
  transition: bottom 0.3s ease;
  border-radius: 0 0 15px 15px;
}

.movie-info-visible {
  bottom: 0;
}

.v-pagination {
  justify-content: center;
  margin-top: 20px;
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

.rating-section {
  background-color: #000000;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.reviews-list {
  max-height: 300px;
  overflow-y: auto;
  padding-right: 8px;
}

.reviews-list::-webkit-scrollbar {
  width: 6px;
}

.reviews-list::-webkit-scrollbar-track {
  background: #ffffff;
  border-radius: 3px;
}

.reviews-list::-webkit-scrollbar-thumb {
  background: #ffffff;
  border-radius: 3px;
}

.add-review {
  background-color: #000000;
  padding: 16px;
  border-radius: 8px;
}

.auth-required {
  background-color: #ffffff;
  padding: 16px;
  border-radius: 8px;
}

.custom-rating {
  --v-rating-color: #FFC107;
}

.custom-rating .mdi-star {
  color: #FFC107 !important;
  text-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
}

.custom-rating .mdi-star-outline {
  color: #616161 !important;
}

.custom-rating .v-icon {
  opacity: 1 !important;
}
</style>