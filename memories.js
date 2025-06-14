
document.addEventListener("DOMContentLoaded", () => {
  const gallery = document.querySelector(".media-gallery");
  const uploads = [
    { type: "image", src: "https://via.placeholder.com/200x150", alt: "Event Photo 1" },
    { type: "image", src: "https://via.placeholder.com/200x150", alt: "Event Photo 2" },
    { type: "video", src: "https://sample-videos.com/video123/mp4/240/big_buck_bunny_240p_1mb.mp4", alt: "Event Video" }
  ];

  uploads.forEach(media => {
    const item = document.createElement(media.type === "image" ? "img" : "video");
    item.src = media.src;
    item.alt = media.alt || "";
    item.controls = media.type === "video";
    item.style.width = "100%";
    item.style.borderRadius = "10px";
    gallery.appendChild(item);
  });
});
