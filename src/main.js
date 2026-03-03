import { onAuthReady } from "./authentication.js";
import { db } from "./firebaseConfig.js";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";

// Function to fetch the signed-in user's name and display it in the UI
function showName() {

    // Get the DOM element where the user's name will be displayed
    // Example: <h1 id="name-goes-here"></h1>
    const nameElement = document.getElementById("name-goes-here");

    // Wait until Firebase Auth finishes checking the user's auth state
    onAuthReady(async (user) => {

        // If no user is logged in, redirect to the login page
        if (!user) {
            location.href = "index.html";
            return; // Stop execution
        }

        // Get the user's Firestore document from the "users" collection
        // Document ID is the user's unique UID
        const userDoc = await getDoc(doc(db, "users", user.uid));

        // Determine which name to display:
        const name = userDoc.exists()            // 1️⃣ Use Firestore name if document exists
            ? userDoc.data().name                // 2️⃣ Otherwise fallback to Firebase displayName
            : user.displayName || user.email;    // 3️⃣ Otherwise fallback to email

       // If the DOM element exists, update its text using a template literal to add "!"
        if (nameElement) {
            nameElement.textContent = `${name}!`;
        }
    });
}


showName();

// Function to read the quote of the day from Firestore
function readQuote(day) {
    const quoteDocRef = doc(db, "quotes", day); // Get a reference to the document

    onSnapshot(
        quoteDocRef,
        (docSnap) => {
            // Listen for real-time updates
            if (docSnap.exists()) {
                //Document existence check
                console.log(docSnap.data().quote);
                document.getElementById("quote-goes-here").innerHTML =
                    docSnap.data().quote;
            } else {
                console.log("No such document!");
            }
        },
        (error) => {
            //Listener/system error
            console.error("Error listening to document: ", error);
        },
    );
}
readQuote("tuesday");

// Helper function to add the sample hike documents.
function addHikeData() {
    const hikesRef = collection(db, "hikes");
    console.log("Adding sample hike data...");
    addDoc(hikesRef, {
        code: "BBY01", name: "Burnaby Lake Park Trail", city: "Burnaby",
        level: "easy", details: "A lovely place for a lunch walk.", length: 10,
        hike_time: 60, lat: 49.2467097082573, lng: -122.9187029619698,
        last_updated: serverTimestamp()
    });
    addDoc(hikesRef, {
        code: "AM01", name: "Buntzen Lake Trail", city: "Anmore",
        level: "moderate", details: "Close to town, and relaxing.", length: 10.5,
        hike_time: 80, lat: 49.3399431028579, lng: -122.85908496766939,
        last_updated: serverTimestamp()
    });
    addDoc(hikesRef, {
        code: "NV01", name: "Mount Seymour Trail", city: "North Vancouver",
        level: "hard", details: "Amazing ski slope views.", length: 8.2,
        hike_time: 120, lat: 49.38847101455571,lng: -122.94092543551031,
        last_updated: serverTimestamp()
    });
}


// Seeds the "hikes" collection with initial data if it is empty
async function seedHikes() {

    // Get a reference to the "hikes" collection
    const hikesRef = collection(db, "hikes");

    // Retrieve all documents currently in the collection
    const querySnapshot = await getDocs(hikesRef);

    // If no documents exist, the collection is empty
    if (querySnapshot.empty) {

        console.log("Hikes collection is empty. Seeding data...");

        // Call function to insert default hike documents
        addHikeData();

    } else {

        // If documents already exist, do not reseed
        console.log("Hikes collection already contains data. Skipping seed.");
    }
}

// Call the seeding function when the main.html page loads.
seedHikes();

async function displayCardsDynamically() {
    let cardTemplate = document.getElementById("hikeCardTemplate");
    const hikesCollectionRef = collection(db, "hikes");

    try {
        const querySnapshot = await getDocs(hikesCollectionRef);
        querySnapshot.forEach(doc => {
            // Clone the template
            let newcard = cardTemplate.content.cloneNode(true);
            const hike = doc.data(); // Get hike data once

            // Populate the card with hike data
            newcard.querySelector('.card-title').textContent = hike.name;
            newcard.querySelector('.card-text').textContent = hike.details || `Located in ${hike.city}.`;
            newcard.querySelector('.card-length').textContent = hike.length;

            // 👇 ADD THIS LINE TO SET THE IMAGE SOURCE
            newcard.querySelector('.card-image').src = `./images/${hike.code}.png`;
            // Add the link with the document ID
            newcard.querySelector(".read-more").href = `eachHike.html?docID=${doc.id}`;

            // Attach the new card to the container
            document.getElementById("hikes-go-here").appendChild(newcard);
        });
    } catch (error) {
        console.error("Error getting documents: ", error);
    }
}

// Call the function to display cards when the page loads
displayCardsDynamically();
