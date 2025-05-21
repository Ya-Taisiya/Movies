<template>
  <v-app>
    <v-row class="menu_row">
      <v-col>
        <div class="menu">
          <nav>
            <v-btn class="menu_btn" :to="{name: 'home'}">Главная</v-btn>
            <v-btn class="menu_btn" :to="{name: 'bookmarks'}">Закладки</v-btn>
          </nav>
        </div>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <router-view></router-view>
      </v-col>
    </v-row>
  </v-app>
</template>

<script setup>

</script>

<style>
.menu_row {
  background-color: #000000; /* Черный фон */
  padding: 10px 0; /* Отступы сверху и снизу */
  border-radius: 15px; /* Закругленные углы */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); /* Тень для эффекта глубины */
}

.menu_btn {
  background-color: rgba(255, 255, 255, 0.9) !important; /* Приглушенный белый с небольшой прозрачностью */
  margin:5px !important; /* Отступы */
  border-radius: 25px; /* Закругленные углы */
  padding: 10px 20px; /* Внутренние отступы */
  font-size: 16px; /* Размер текста */
  font-weight: bold; /* Жирный текст */
  color: #333333; /* Темно-серый текст */
  border: 2px solid transparent; /* Прозрачная граница */
  transition: all 0.3s ease; /* Плавные переходы */
  cursor: pointer; /* Курсор в виде указателя */
}

.menu_btn:hover {
  background-color: rgba(240, 240, 240, 0.9) !important; /* Приглушенный светло-серый при наведении */
  border-color: #555555; /* Темно-серая граница при наведении */
  transform: scale(1.05); /* Увеличение кнопки при наведении */
}

.menu {
  display: flex;
  justify-content: space-evenly; /* Равномерное распределение кнопок */
  align-items: center; /* Выравнивание по центру */
}
</style>