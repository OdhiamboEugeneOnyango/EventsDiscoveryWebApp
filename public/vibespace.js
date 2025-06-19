
document.addEventListener("DOMContentLoaded", () => {
  const sections = {
    general: document.querySelector(".general-feed .content"),
    threads: document.querySelector(".event-threads .content"),
    communities: document.querySelector(".communities .content"),
    media: document.querySelector(".media-reactions .content"),
  };

  const samplePosts = [
    { content: "Who’s going to Afrobeats Night this Friday? 🎶", type: "threads" },
    { content: "My top 3 food events in Nairobi this semester 🍽️👇", type: "communities" },
    { content: "Anyone else think the DJ last night was insane? 🔥", type: "threads" },
    {
      content: "Missed the event? Here’s what it looked like 🎥👇",
      type: "media",
      memoryId: 101,
      mediaType: "video",
      mediaSrc: "media/event101.mp4"
    },
    {
      content: "Top dance move caught on cam! 💃",
      type: "media",
      memoryId: 102,
      mediaType: "image",
      mediaSrc: "media/dance102.jpg"
    },
    { content: "Any jazz heads here? Drop your favorite local artist 🎷", type: "communities" }
  ];

  samplePosts.forEach(post => {
    const postContainer = document.createElement("div");
    postContainer.classList.add("post");

    const text = document.createElement("p");
    text.textContent = post.content;
    postContainer.appendChild(text);

    // Media preview logic
    if (post.type === "media" && post.mediaSrc) {
      const mediaPreview = document.createElement(post.mediaType === "video" ? "video" : "img");
      mediaPreview.src = post.mediaSrc;
      mediaPreview.classList.add("media-preview");
      if (post.mediaType === "video") mediaPreview.controls = true;
      mediaPreview.onclick = () => showMediaPopup(post);
      postContainer.appendChild(mediaPreview);
    }

    // Reactions
    const reactionBar = document.createElement("div");
    reactionBar.classList.add("reactions");
    ["👍", "😂", "🔥", "💬"].forEach(emoji => {
      const span = document.createElement("span");
      span.textContent = emoji;
      span.classList.add("reaction");
      reactionBar.appendChild(span);
    });
    postContainer.appendChild(reactionBar);

    sections[post.type].appendChild(postContainer);
  });

  // Submit post
  document.querySelectorAll(".post-form").forEach(form => {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const input = this.querySelector("textarea");
      const newPost = input.value.trim();
      if (newPost) {
        const postEl = document.createElement("div");
        postEl.classList.add("post");
        postEl.innerHTML = `<p>${newPost}</p>
          <div class="reactions"><span>👍</span> <span>😂</span> <span>🔥</span> <span>💬</span></div>`;
        this.parentElement.querySelector(".content").appendChild(postEl);
        input.value = "";
      }
    });
  });

  // Media popup viewer
  function showMediaPopup(post) {
    const popup = document.createElement("div");
    popup.classList.add("media-popup");

    const media = document.createElement(post.mediaType === "video" ? "video" : "img");
    media.src = post.mediaSrc;
    if (post.mediaType === "video") media.controls = true;

    const desc = document.createElement("p");
    desc.textContent = post.content;

    const comments = document.createElement("div");
    comments.classList.add("popup-comments");
    comments.innerHTML = "<strong>Comments:</strong><ul><li>🔥🔥🔥</li><li>Iconic moment</li></ul>";

    const link = document.createElement("a");
    link.href = `/memories.html#media-${post.memoryId}`;
    link.textContent = "Go to Memories →";
    link.classList.add("goto-memories");

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "Close";
    closeBtn.onclick = () => popup.remove();

    popup.appendChild(media);
    popup.appendChild(desc);
    popup.appendChild(comments);
    popup.appendChild(link);
    popup.appendChild(closeBtn);
    document.body.appendChild(popup);
  }
});
