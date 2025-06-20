document.addEventListener("DOMContentLoaded", () => {
  const gallery = document.getElementById("mediaGallery");
  const uploadForm = document.getElementById("uploadForm");
  const mediaTemplate = document.getElementById("mediaCardTemplate");

  // Simulated media for now – ready for MongoDB integration
  const sampleMemories = [
    {
      type: "image",
      url: "https://via.placeholder.com/400x300",
      caption: "Epic vibes last night 🔥",
      comments: ["This was insane!", "Where was this?"]
    },
    {
      type: "video",
      url: "https://sample-videos.com/video123/mp4/240/big_buck_bunny_240p_1mb.mp4",
      caption: "A sneak peek 👀🎥",
      comments: []
    }
  ];

  function renderMedia(media) {
    const clone = mediaTemplate.content.cloneNode(true);
    const container = clone.querySelector(".media-container");
    const caption = clone.querySelector(".caption");
    const commentList = clone.querySelector(".comment-list");
    const input = clone.querySelector(".comment-input");

    if (media.type === "image") {
      const img = document.createElement("img");
      img.src = media.url;
      img.alt = media.caption;
      container.appendChild(img);
    } else if (media.type === "video") {
      const video = document.createElement("video");
      video.src = media.url;
      video.controls = true;
      container.appendChild(video);
    }

    caption.textContent = media.caption;

    media.comments.forEach(comment => {
      const li = document.createElement("li");
      li.textContent = comment;
      commentList.appendChild(li);
    });

    input.addEventListener("keypress", e => {
      if (e.key === "Enter") {
        e.preventDefault();
        const text = input.value.trim();
        if (text) {
          const li = document.createElement("li");
          li.textContent = text;
          commentList.appendChild(li);
          input.value = "";
          // TODO: Save comment to database
        }
      }
    });

    gallery.appendChild(clone);
  }

  sampleMemories.forEach(renderMedia);

  uploadForm.addEventListener("submit", e => {
    e.preventDefault();
    // TODO: Submit media to backend/MongoDB
    alert("Upload functionality not connected yet.");
  });
});
