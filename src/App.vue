<script setup lang="ts">
import { computed, nextTick, onMounted, ref, shallowRef, watch } from 'vue';
import maplibregl, { type Map, type Marker } from 'maplibre-gl';

import placesData from './data/places.json';
import type { Place } from './types/place';

const places = placesData as Place[];

const selectedPlace = ref<Place>(places[0]);
const mapContainer = ref<HTMLDivElement | null>(null);
const map = shallowRef<Map | null>(null);
const currentLocationMarker = shallowRef<Marker | null>(null);
const selectedPlaceMarker = shallowRef<Marker | null>(null);
const currentSlide = ref(0);

const currentLocation = {
  lng: -70.882526,
  lat: -53.136347
};

const satelliteStyle = {
  version: 8,
  sources: {
    'esri-world-imagery': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      ],
      tileSize: 256,
      attribution:
        'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
    }
  },
  layers: [
    {
      id: 'esri-world-imagery-layer',
      type: 'raster',
      source: 'esri-world-imagery',
      minzoom: 0,
      maxzoom: 22
    }
  ]
} as maplibregl.StyleSpecification;

const currentHeroStyle = computed(() => ({
  backgroundImage: `linear-gradient(
    90deg,
    rgba(15, 23, 42, 0.88),
    rgba(20, 83, 45, 0.68),
    rgba(15, 23, 42, 0.35)
  ), url(${selectedPlace.value.heroImage})`
}));

const activeImage = computed(() => {
  return selectedPlace.value.gallery[currentSlide.value];
});

function selectPlace(place: Place) {
  selectedPlace.value = place;
  currentSlide.value = 0;
}

function nextSlide() {
  currentSlide.value =
    (currentSlide.value + 1) % selectedPlace.value.gallery.length;
}

function previousSlide() {
  currentSlide.value =
    currentSlide.value === 0
      ? selectedPlace.value.gallery.length - 1
      : currentSlide.value - 1;
}

function fitMapToVisiblePoints() {
  if (!map.value) return;

  const bounds = new maplibregl.LngLatBounds()
    .extend([currentLocation.lng, currentLocation.lat])
    .extend([
      selectedPlace.value.coordinates.lng,
      selectedPlace.value.coordinates.lat
    ]);

  map.value.fitBounds(bounds, {
    padding: 80,
    maxZoom: 15,
    essential: true
  });
}

function updateSelectedPlaceMarker() {
  if (!map.value) return;

  selectedPlaceMarker.value?.remove();
  selectedPlaceMarker.value = new maplibregl.Marker({
    color: '#f97316'
  })
    .setLngLat([
      selectedPlace.value.coordinates.lng,
      selectedPlace.value.coordinates.lat
    ])
    .setPopup(
      new maplibregl.Popup().setHTML(`
        <strong>${selectedPlace.value.name}</strong>
        <p>${selectedPlace.value.shortDescription}</p>
      `)
    )
    .addTo(map.value);
}

function addCurrentLocationMarker() {
  if (!map.value) return;

  currentLocationMarker.value?.remove();
  currentLocationMarker.value = new maplibregl.Marker({
    color: '#22c55e'
  })
    .setLngLat([currentLocation.lng, currentLocation.lat])
    .setPopup(
      new maplibregl.Popup().setHTML(`
        <strong>Usted</strong>
        <p>Ubicación actual</p>
      `)
    )
    .addTo(map.value);
}

function updateMapMarkers() {
  updateSelectedPlaceMarker();
  fitMapToVisiblePoints();
}

function initializeMap() {
  if (!mapContainer.value) return;

  map.value = new maplibregl.Map({
    container: mapContainer.value,
    style: satelliteStyle,
    center: [
      selectedPlace.value.coordinates.lng,
      selectedPlace.value.coordinates.lat
    ],
    zoom: 14,
    pitch: 55,
    bearing: -20
  });

  map.value.addControl(
    new maplibregl.NavigationControl({
      visualizePitch: true
    }),
    'top-right'
  );

  map.value.addControl(
    new maplibregl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true
    }),
    'top-right'
  );

  addCurrentLocationMarker();
  updateMapMarkers();
}

onMounted(async () => {
  await nextTick();
  initializeMap();
});

watch(selectedPlace, () => {
  updateMapMarkers();
});
</script>

<template>
  <div class="site-shell">
    <header class="navbar">
      <a href="#inicio" class="navbar__brand">Rutas Magallánicas</a>

      <nav class="navbar__links">
        <a href="#inicio">Inicio</a>
        <a href="#fotos">Fotos</a>
        <a href="#video">Video</a>
        <a href="#lugares">Más lugares</a>
      </nav>
    </header>

    <main>
      <section id="inicio" class="hero" :style="currentHeroStyle">
        <div class="hero__content">
          <p class="eyebrow">{{ selectedPlace.location }}</p>

          <h1>{{ selectedPlace.name }}</h1>

          <div class="hero__grid">
            <article class="hero__card hero__card--map">
              <div ref="mapContainer" class="map"></div>
            </article>

            <article class="hero__card hero__card--description">
              <h2>Descripción del lugar</h2>
              <p>{{ selectedPlace.shortDescription }}</p>
              <button class="primary-button" type="button" @click="fitMapToVisiblePoints">
                Ver ambos puntos en el mapa
              </button>
            </article>
          </div>
        </div>
      </section>

      <section id="fotos" class="section section--soft">
        <div class="section__header">
          <p class="eyebrow">Galería</p>
          <h2>Carrusel de fotos del lugar</h2>
          <p>{{ selectedPlace.longDescription }}</p>
        </div>

        <div class="carousel">
          <button class="carousel__button" type="button" @click="previousSlide">
            ‹
          </button>

          <figure class="carousel__image-wrapper">
            <img :src="activeImage" :alt="`Fotografía de ${selectedPlace.name}`" />
            <figcaption>
              Imagen {{ currentSlide + 1 }} de {{ selectedPlace.gallery.length }}
            </figcaption>
          </figure>

          <button class="carousel__button" type="button" @click="nextSlide">
            ›
          </button>
        </div>
      </section>

      <section id="video" class="section">
        <div class="section__header">
          <p class="eyebrow">Audiovisual</p>
          <h2>Video del lugar</h2>
          <p>
            En una versión final, aquí podríamos insertar un video turístico,
            una cápsula histórica o una guía audiovisual del punto visitado.
          </p>
        </div>

        <div class="video-wrapper">
          <iframe
            :src="selectedPlace.videoUrl"
            title="Video turístico del lugar"
            allowfullscreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          ></iframe>
        </div>
      </section>

      <section id="lugares" class="section section--soft">
        <div class="section__header">
          <p class="eyebrow">Explorar</p>
          <h2>Más lugares</h2>
          <p>
            Estos lugares vienen desde un archivo JSON. Más adelante podrían venir
            desde una API o panel administrador.
          </p>
        </div>

        <div class="places-grid">
          <article
            v-for="place in places"
            :key="place.id"
            class="place-card"
            :class="{ 'place-card--active': place.id === selectedPlace.id }"
            @click="selectPlace(place)"
          >
            <img :src="place.heroImage" :alt="place.name" />

            <div class="place-card__body">
              <p class="eyebrow">{{ place.location }}</p>
              <h3>{{ place.name }}</h3>
              <p>{{ place.shortDescription }}</p>
            </div>
          </article>
        </div>
      </section>
    </main>

    <footer class="footer">
      <strong>Rutas Magallánicas</strong>
      <span>Prototipo web con Vue 3 + MapLibre GL JS</span>
    </footer>
  </div>
</template>
