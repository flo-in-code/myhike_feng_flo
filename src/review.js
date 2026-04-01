import { db } from "./firebaseConfig.js";
import { auth } from "./firebaseConfig.js";
import {
    doc,
    getDoc,
    collection,
    addDoc,
    serverTimestamp,
} from "firebase/firestore";
import * as bootstrap from "bootstrap";

//-----------------------------------------------------------
// Get hike ID from Local Storage
// Go to firestore to get the name of the hike (using this ID)
// and display in title of the page
//-----------------------------------------------------------
var hikeDocID = localStorage.getItem("hikeDocID");

displayHikeName(hikeDocID);

async function displayHikeName(id) {
    try {
        const hikeRef = doc(db, "hikes", id);
        const hikeSnap = await getDoc(hikeRef);

        if (hikeSnap.exists()) {
            const hikeName = hikeSnap.data().name;
            document.getElementById("hikeName").textContent = hikeName;
        } else {
            console.log("No such hike found!");
        }
    } catch (error) {
        console.error("Error getting hike document:", error);
    }
}


//Add event listener to stars after DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
    manageStars();
});

let hikeRating = 0;
function manageStars() {
    // ⭐ Make star icons clickable and calculate rating
    const stars = document.querySelectorAll('.star');

    // Step 1️⃣ – Add click behavior for each star
    stars.forEach((star, index) => {
        star.addEventListener('click', () => {
            // Fill all stars up to the one clicked
            stars.forEach((s, i) => {
                s.textContent = i <= index ? 'star' : 'star_outline';
            });
            // Save rating value
            hikeRating = index + 1;
            console.log("Current rating:", hikeRating);
        });
    });
}


//---------------------------------------------------------------------
// Function to write review data into Firestore
// Triggered when the authenticated user clicks the "Submit" button
// Collects form data and adds a new document to the selected hike's
// "reviews" subcollection: hikes/{hikeDocID}/reviews/{reviewDocID}
// Redirects to eachHike page upon success
//---------------------------------------------------------------------

async function writeReview() {
    console.log("Inside write review");

    // 🧾 Collect form data
    const hikeTitle = document.getElementById("title").value;
    const hikeLevel = document.getElementById("level").value;
    const hikeSeason = document.getElementById("season").value;
    const hikeDescription = document.getElementById("description").value;
    const hikeFlooded = document.querySelector('input[name="flooded"]:checked')?.value;
    const hikeScrambled = document.querySelector('input[name="scrambled"]:checked')?.value;

    // Log collected data for verification
    console.log("inside write review, rating =", hikeRating);
    console.log("hikeDocID =", hikeDocID);
    console.log("Collected review data:");
    console.log(hikeTitle, hikeLevel, hikeSeason, hikeDescription, hikeFlooded, hikeScrambled);

    // simple validation
    if (!hikeTitle || !hikeDescription) {
        alert("Please complete all required fields.");
        return;
    }

    // get a pointer to the user who is logged in
    const user = auth.currentUser;

    if (user) {
        try {
            const userID = user.uid;

            // ✅ Store review as subcollection under this hike
            // Path: hikes/{hikeDocID}/reviews/{autoReviewID}
            await addDoc(collection(db, "hikes", hikeDocID, "reviews"), {
                userID: userID,
                title: hikeTitle,
                level: hikeLevel,
                season: hikeSeason,
                description: hikeDescription,
                flooded: hikeFlooded,
                scrambled: hikeScrambled,
                rating: hikeRating,
                timestamp: serverTimestamp()
            });

            console.log("Review successfully written!");


            // Show thank-you modal
            const thankYouModalEl = document.getElementById("thankYouModal");
            const thankYouModal = new bootstrap.Modal(thankYouModalEl);
            thankYouModal.show();

            // Redirect AFTER user closes the modal
            thankYouModalEl.addEventListener("hidden.bs.modal", () => {
                window.location.href = `eachHike.html?docID=${hikeDocID}`;
            }, { once: true });

        } catch (error) {
            console.error("Error adding review:", error);
        }
    } else {
        console.log("No user is signed in");
        //window.location.href = "review.html";
    }
}


// Add event listener to stars after DOM content is loaded
// Add event listener to submit button after DOM content is loaded (It’s like the browser’s built-in bell that rings automatically.)
document.addEventListener('DOMContentLoaded', () => { //event listener for submit button 
		manageStars();
    
    // 👇👇👇 Add these two lines
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.addEventListener('click', writeReview);
});