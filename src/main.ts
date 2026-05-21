import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { configurarIconosLeaflet } from './app/core/utils/leaflet-config';

// Inicializar la configuración de íconos de Leaflet
configurarIconosLeaflet();

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));