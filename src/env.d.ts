/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    user: import('./models/User').UserDocument | null;
  }
}
