<template>
  <v-app>
    <v-row>
      <v-col>
        <div class="menu">
          <nav>
            <v-btn color="success" :to="{name: 'home'}">Главная</v-btn>
            <v-btn color="success" :to="{name: 'bookmarks'}">Закладки</v-btn>
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
</style>
