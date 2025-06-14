
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
});
