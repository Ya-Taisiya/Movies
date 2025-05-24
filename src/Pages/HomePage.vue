<template>
  <v-container class="home-page">
    <!-- Кнопка для открытия модального окна -->
    <v-btn class="auth-button" @click="handleAuthButtonClick">
      {{ isAuthenticated ? 'Выйти' : 'Авторизация' }}
    </v-btn>

    <!-- Поисковая строка и фильтры -->
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
             
              <p><strong>Год:</strong> {{ movie.year }}</p>
              <p><strong>Жанры:</strong> {{ movie.genres.join(', ') }}</p>
              <v-btn color="grey" @click.stop="addToBookmarks(movie)">Добавить в закладки</v-btn>
            </div>
          </v-img>
        </v-card>
      </v-col>
    </v-row>

    <!-- Сообщение, если фильмы не найдены -->
    <v-row v-if="filteredMovies.length === 0" justify="center">
      <v-col cols="12" class="text-center">
        <v-alert type="info">
          Фильмы по вашему запросу не найдены. Попробуйте изменить параметры поиска.
        </v-alert>
      </v-col>
    </v-row>

    <!-- Пагинация -->
    <v-row v-if="filteredMovies.length > 0">
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
          <p><strong>Жанры:</strong> {{ selectedMovie.genres.join(', ') }}</p>
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
    
    // Фильтры
    const selectedYear = ref(null);
    const selectedGenre = ref(null);

    // Массив фильмов с обложками
    const movies = [
      {
        id: 1,
        title: "Один дома",
        poster: "https://st.kp.yandex.net/images/film_big/8124.jpg",
        year: 1990,
        duration: 103,
        genres: ["Комедия", "Семейный"],
        description: "Американское семейство отправляется из Чикаго в Европу, но в спешке сборов бестолковые родители забывают дома одного из своих детей. Юное создание, однако, не теряется и демонстрирует чудеса изобретательности. И когда в дом залезают грабители, им приходится не раз пожалеть о встрече с милым крошкой.",
        trailer: "https://rutube.ru/play/embed/b82cd9a27b3c4bb5fa2fce80403530b8"
      },
      {
        id: 2,
        title: "1+1",
        poster: "https://st.kp.yandex.net/images/film_big/535341.jpg",
        year: 2011,
        duration: 112,
        genres: ["Драма", "Комедия"],
        description: "Пострадав в результате несчастного случая, богатый аристократ Филипп нанимает в помощники человека, который менее всего подходит для этой работы — молодого жителя предместья Дрисса, только что освободившегося из тюрьмы. Несмотря на то, что Филипп прикован к инвалидному креслу, Дриссу удается привнести в размеренную жизнь аристократа дух приключений.",
        trailer: "https://rutube.ru/play/embed/699385a53a6e786fd2bdfe307bb15740/"
      },
      {
        id: 3,
        title: "Джентльмены предпочитают блондинок",
        poster: "https://avatars.mds.yandex.net/get-kinopoisk-image/1777765/ad264447-ab0e-41a6-9e78-f43a2a30c587/1920x",
        year: 1953,
        duration: 91,
        genres: ["Мюзикл", "Комедия", "Мелодрама"],
        description: "Две очаровательные певицы из маленького городка, Лорелей Ли и Дороти Шоу, отправляются в Париж на гастроли. Лорелей обручена с богатым наследником, но её привлекают и другие мужчины, что приводит к забавным и неожиданным ситуациям. Мюзикл с участием Мэрилин Монро, ставший классикой Голливуда.",
        trailer: "https://rutube.ru/play/embed/736f931acdfd833203a7324b0a9ab135/"
      },
      {
        id: 4,
        title: "Волк с Уолл-Стрит",
        poster: "https://st.kp.yandex.net/images/film_big/462682.jpg",
        year: 2013,
        duration: 180,
        genres: ["Драма", "Криминал", "Биография"],
        description: "История взлета и падения брокера Джордана Белфорта, который сколотил состояние на мошеннических схемах и погрузился в мир наркотиков, разврата и безудержного богатства. Фильм Мартина Скорсезе с Леонардо ДиКаприо в главной роли.",
        trailer: "https://rutube.ru/play/embed/98de9f7df63abdb1f88eb1692f8eaec3/"
      },
      {
        id: 5,
        title: "Пираты Карибского моря: Проклятие Черной жемчужины",
        poster: "https://st.kp.yandex.net/images/film_big/4374.jpg",
        year: 2003,
        duration: 143,
        genres: ["Фэнтези", "Боевик", "Приключения"],
        description: "Капитан Джек Воробей объединяется с кузнецом Уиллом Тернером, чтобы спасти похищенную дочь губернатора от проклятых пиратов, превратившихся в живых мертвецов под предводительством капитана Барбоссы.",
        trailer: "https://rutube.ru/play/embed/da1fd7d821dd1f962e261e5dc528f538/"
      },
      {
        id: 6,
        title: "Брат 2",
        poster: "https://st.kp.yandex.net/images/film_big/41520.jpg",
        year: 2000,
        duration: 127,
        genres: ["Криминал", "Драма", "Боевик"],
        description: "Данила Багров отправляется в Америку, чтобы помочь брату своего погибшего друга. В чужой стране он сталкивается с местной мафией и продолжает отстаивать свою правду с помощью силы и смекалки.",
        trailer: "https://vkvideo.ru/video_ext.php?oid=-69606939&id=456239166&hd=2&autoplay=1"
      },
      {
        id: 7,
        title: "Достать ножи",
        poster: "https://st.kp.yandex.net/images/film_big/1188529.jpg",
        year: 2019,
        duration: 130,
        genres: ["Детектив", "Комедия", "Криминал"],
        description: "Детектив Бенуа Блан расследует загадочное убийство известного писателя Харлана Тромби, произошедшее после семейного праздника. Каждый из эксцентричных родственников оказывается под подозрением.",
        trailer: "https://vkvideo.ru/video_ext.php?oid=-217672812&id=456239405&hd=2&autoplay=1"
      },
      {
        id: 8,
        title: "Гарри Поттер и философский камень",
        poster: "https://st.kp.yandex.net/images/film_big/689.jpg",
        year: 2001,
        duration: 152,
        genres: ["Фэнтези", "Приключения", "Семейный"],
        description: "Первая часть истории о юном волшебнике Гарри Поттере, который узнает о своем магическом наследии и поступает в школу чародейства и волшебства Хогвартс.",
        trailer: "https://rutube.ru/play/embed/cb7b3c0aad5c8a1e5cf5d22f59cc65b3/"
      },
      {
        id: 9,
        title: "Интерстеллар",
        poster: "https://st.kp.yandex.net/images/film_big/258687.jpg",
        year: 2014,
        duration: 169,
        genres: ["Фантастика", "Драма", "Приключения"],
        description: "Группа исследователей отправляется через червоточину в космосе в поисках нового дома для человечества, столкнувшегося с глобальным продовольственным кризисом.",
        trailer: "https://rutube.ru/play/embed/17465fc541700b94ebd5648423675100/"
      },
      {
        id: 10,
        title: "В бой идут одни старики",
        poster: "https://st.kp.yandex.net/images/film_big/464963.jpg",
        year: 1973,
        duration: 92,
        genres: ["Драма", "Военный", "История"],
        description: "Военная драма о советских летчиках-истребителях во время Великой Отечественной войны, сочетающая героизм, фронтовое братство и лирические нотки.",
        trailer: "https://rutube.ru/play/embed/a6771ca1e47b690d2c434553ebfdcb93/"
      },
      {
        id: 11,
        title: "Зеленая миля",
        poster: "https://st.kp.yandex.net/images/film_big/435.jpg",
        year: 1999,
        duration: 189,
        genres: ["Драма", "Фэнтези", "Криминал"],
        description: "Надзиратель тюремного блока смертников Пол Эджкомб вспоминает необычного заключенного — гиганта Джона Коффи, обладающего сверхъестественными способностями.",
        trailer: "https://rutube.ru/play/embed/b5c4021d29fac53e548c6d0d92fb55d2/"
      },
      {
        id: 12,
        title: "Иван Васильевич меняет профессию",
        poster: "https://st.kp.yandex.net/images/film_big/42664.jpg",
        year: 1973,
        duration: 88,
        genres: ["Комедия", "Фантастика"],
        description: "Из-за неисправности машины времени управдом Бунша и вор Милославский попадают в эпоху Ивана Грозного, а сам царь оказывается в советской Москве.",
        trailer: "https://rutube.ru/play/embed/de108b940b59e5e9d361077328ca9201/"
      },
      {
        id: 13,
        title: "Зверополис",
        poster: "https://st.kp.yandex.net/images/film_big/775276.jpg",
        year: 2016,
        duration: 108,
        genres: ["Мультфильм", "Комедия", "Приключения"],
        description: "Оптимистичная зайчиха Джуди Хоппс становится первым кроликом в полиции Зверополиса и вместе с хитрым лисом Ником Уайлдом раскрывает заговор.",
        trailer: "https://rutube.ru/play/embed/c732611737284a615ef6f26573c105f3/"
      },
      {
        id: 14,
        title: "Побег из Шоушенка",
        poster: "https://st.kp.yandex.net/images/film_big/326.jpg",
        year: 1994,
        duration: 142,
        genres: ["Драма", "Криминал"],
        description: "Несправедливо осужденный банкир Энди Дюфрейн годами планирует побег из тюрьмы, сохраняя надежду и достоинство в нечеловеческих условиях.",
        trailer: "https://rutube.ru/play/embed/cae96c24f81419ccd444ed151a169985/"
      },
      {
        id: 15,
        title: "Начало",
        poster: "https://st.kp.yandex.net/images/film_big/447301.jpg",
        year: 2010,
        duration: 148,
        genres: ["Фантастика", "Боевик", "Триллер"],
        description: "Группа специалистов по внедрению в сны пытается совершить невозможное - внедрить идею в подсознание человека через его сновидения.",
        trailer: "https://rutube.ru/play/embed/27c335dcbef386ff6adfd3fb392465c0/"
      },
      {
        id: 16,
        title: "Аватар",
        poster: "https://st.kp.yandex.net/images/film_big/251733.jpg",
        year: 2009,
        duration: 162,
        genres: ["Фантастика", "Боевик", "Приключения"],
        description: "Бывший морпех Джейк Салли, приняв облик инопланетного аватара, оказывается перед выбором между выполнением задания и защитой мира Пандоры.",
        trailer: "https://rutube.ru/play/embed/2b28ced9e49b7204c7cfb5a8eda790a9/"
      },
      {
        id: 17,
        title: "Брат",
        poster: "https://st.kp.yandex.net/images/film_big/41519.jpg",
        year: 1997,
        duration: 96,
        genres: ["Криминал", "Драма"],
        description: "Демобилизованный Данила Багров приезжает в Петербург и неожиданно для себя становится защитником слабых в криминальном мире 1990-х.",
        trailer: "https://vkvideo.ru/video_ext.php?oid=-69606939&id=456239162&hd=2&autoplay=1"
      },
      {
        id: 18,
        title: "Гнев человеческий",
        poster: "https://st.kp.yandex.net/images/film_big/1318972.jpg",
        year: 2021,
        duration: 118,
        genres: ["Боевик", "Триллер", "Криминал"],
        description: "Таинственный охранник инкассаторской машины оказывается человеком с темным прошлым, мстящим за убийство своего сына.",
        trailer: "https://rutube.ru/play/embed/8831f2fe4007c5d2eed13ec625ef3655/"
      }
    ];

    // Опции для фильтров
    const yearOptions = computed(() => {
      const years = [...new Set(movies.map(movie => movie.year))];
      return years.sort((a, b) => b - a).map(year => ({
        title: year.toString(),
        value: year
      }));
    });

    const genreOptions = computed(() => {
      const allGenres = movies.flatMap(movie => movie.genres);
      const uniqueGenres = [...new Set(allGenres)];
      return uniqueGenres.sort().map(genre => ({
        title: genre,
        value: genre
      }));
    });

    const filteredMovies = computed(() => {
      let filtered = movies;
      
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
      
      // Фильтрация по жанру
      if (selectedGenre.value) {
        filtered = filtered.filter(movie => 
          movie.genres.includes(selectedGenre.value)
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

    const applyFilters = () => {
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
      selectedYear,
      selectedGenre,
      yearOptions,
      genreOptions,
      handlePageChange,
      searchMovies,
      applyFilters,
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
  background-color: #0f0f13;
  min-height: 100vh;
  padding: 0px;
  max-width: 100vw;
}

.auth-button {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 1000;
  background-color: #6c5ce7;
  color: rgb(255, 255, 255);
  font-weight: 500;
  text-transform: none;
  border-radius: 8px;
  padding: 8px 16px;
  letter-spacing: 0.5px;
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

.v-pagination {
  justify-content: center;
  margin-top: 40px;
}

.v-pagination :deep(.v-pagination__item),
.v-pagination :deep(.v-pagination__prev),
.v-pagination :deep(.v-pagination__next) {
  background-color: #1a1a23;
  color: #d0d0d8;
  font-weight: 500;
  border: 1px solid #2a2a35;
  margin: 0 4px;
}

.v-pagination :deep(.v-pagination__item--is-active) {
  background-color: #6c5ce7;
  color: white;
  border-color: #6c5ce7;
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

.rating-section {
  background-color: #21212b;
  padding: 22px;
  border-radius: 12px;
  margin-bottom: 28px;
  border: 1px solid #2a2a35;
}

.rating-section h3, 
.rating-section h4 {
  color: white;
  margin-bottom: 12px;
}

.reviews-list {
  max-height: 320px;
  overflow-y: auto;
  padding-right: 12px;
  scrollbar-width: thin;
}

.reviews-list::-webkit-scrollbar {
  width: 6px;
}

.reviews-list::-webkit-scrollbar-track {
  background: #1a1a23;
  border-radius: 3px;
}

.reviews-list::-webkit-scrollbar-thumb {
  background: #6c5ce7;
  border-radius: 3px;
}

.add-review {
  background-color: #21212b;
  padding: 22px;
  border-radius: 12px;
  border: 1px solid #2a2a35;
}

.add-review h4 {
  color: rgb(255, 255, 255);
  margin-bottom: 18px;
  font-size: 1.2rem;
}

.auth-required {
  background-color: #21212b;
  padding: 22px;
  border-radius: 12px;
  border: 1px solid #2a2a35;
}

.custom-rating {
  --v-rating-color: #fdcb6e;
}

.custom-rating .mdi-star {
  color: #fdcb6e !important;
}

.custom-rating .mdi-star-outline {
  color: #4a4a5a !important;
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

.v-textarea :deep(.v-field) {
  background-color: #21212b;
  border-radius: 10px;
}

.v-textarea :deep(.v-field__input) {
  color: #f0f0f5;
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

.v-dialog .v-card {
  border-radius: 14px;
  overflow: hidden;
}

.v-tabs :deep(.v-tab) {
  font-weight: 500;
  text-transform: none;
  color: #a0a0b0;
}

.v-tabs :deep(.v-tab--selected) {
  color: #6c5ce7;
}

.v-tabs :deep(.v-slide-group__content) {
  background-color: #1a1a23;
}

.v-divider {
  border-color: #2a2a35;
  margin: 24px 0;
}

iframe {
  border: none;
  border-radius: 8px;
}
</style>