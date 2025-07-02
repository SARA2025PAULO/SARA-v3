import { db } from "./firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

async function testFirestore() {
  const testRef = doc(db, "test", "testDoc");

  await setDoc(testRef, { funcionando: true });
  console.log("✔️ Documento escrito");

  const snapshot = await getDoc(testRef);
  console.log("📄 Documento leído:", snapshot.data());
}

testFirestore();
