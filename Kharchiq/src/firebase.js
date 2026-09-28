import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDcrBzIm-mB2-3fc2lN3xFoyy9xFzjItaY",
  authDomain: "kharchiq-72d7a.firebaseapp.com",
  projectId: "kharchiq-72d7a",
  appId: "1:1004156495931:web:7b7521ec1647fbd2a6141e",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);