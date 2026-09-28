// Loads the Blender-built models (see blender/*.py). Scenes fall back to
// procedural geometry for anything that failed to load.
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

export const ASSETS = { hall: null };

export async function loadAssets() {
  const draco = new DRACOLoader().setDecoderPath('./draco/');
  const loader = new GLTFLoader().setDRACOLoader(draco);
  try {
    const gltf = await loader.loadAsync('./models/hall.glb');
    gltf.scene.traverse((o) => {
      if (o.isMesh) o.geometry.userData.shared = true;
    });
    ASSETS.hall = gltf.scene;
  } catch (err) {
    console.warn('hall.glb unavailable, using procedural houses', err);
  }
  draco.dispose();
}
