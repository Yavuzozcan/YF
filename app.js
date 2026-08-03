// =====================================
// YF - Yavuz Finans
// Sürüm: v0.1.0
// =====================================

document.addEventListener("DOMContentLoaded", () => {
    console.log("YF v0.1 başlatıldı");

    // Saat bazlı karşılama
    const hour = new Date().getHours();
    const welcome = document.getElementById("welcomeText");

    if (welcome) {
        if (hour < 12) {
            welcome.textContent = "Günaydın Yavuz 👋";
        } else if (hour < 18) {
            welcome.textContent = "İyi Günler Yavuz 👋";
        } else {
            welcome.textContent = "İyi Akşamlar Yavuz 👋";
        }
    }
});
