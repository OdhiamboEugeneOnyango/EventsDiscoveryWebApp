document.addEventListener("DOMContentLoaded", () => {
  const emergencyBtn = document.createElement("button");
  emergencyBtn.textContent = "Call for Help";
  emergencyBtn.style.backgroundColor = "#ff4b5c";
  emergencyBtn.style.color = "#fff";
  emergencyBtn.style.padding = "1rem 2rem";
  emergencyBtn.style.marginTop = "1rem";
  emergencyBtn.style.border = "none";
  emergencyBtn.style.borderRadius = "8px";
  emergencyBtn.style.cursor = "pointer";
  emergencyBtn.addEventListener("click", () => {
    alert("Connecting you to emergency support services...");
  });
  document.querySelector(".emergency").appendChild(emergencyBtn);

  const sections = {
    reviews: document.querySelector(".reviews"),
    ratings: document.querySelector(".ratings"),
    badges: document.querySelector(".badges")
  };

  const sampleData = {
    reviews: [
      { venue: "Carnivore Grounds", rating: 4.2, comment: "Well lit and secure entrance." },
      { venue: "KICC", rating: 3.8, comment: "Spacious but not enough exit signs." }
    ],
    ratings: [
      { organizer: "Afrobeats Agency", score: "⭐⭐⭐⭐", feedback: "Great crowd control." },
      { organizer: "Foodie Vibes", score: "⭐⭐⭐", feedback: "Fun but a bit chaotic." }
    ],
    badges: [
      { level: "Verified Organizer", criteria: "3+ successful events, 4.0+ average safety score" },
      { level: "Top Trusted", criteria: "Featured in SafeZone 3 times in a row" }
    ]
  };

  for (const [key, list] of Object.entries(sampleData)) {
    const container = sections[key];
    list.forEach(item => {
      const block = document.createElement("div");
      block.classList.add("item-block");
      block.style.margin = "1rem 0";
      block.style.padding = "1rem";
      block.style.background = "#f9f9f9";
      block.style.borderRadius = "10px";
      block.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)";
      block.innerHTML = Object.entries(item).map(([k, v]) => `<p><strong>${k}:</strong> ${v}</p>`).join("");
      container.appendChild(block);
    });
  }
});
