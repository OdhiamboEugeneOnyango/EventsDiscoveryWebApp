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
    { content: "Missed the event? Here’s what it looked like 🎥👇", type: "media", memoryId: 101 },
    { content: "Any jazz heads here? Drop your favorite local artist 🎷", type: "communities" }
  ];

  samplePosts.forEach(post => {
    const postContainer = document.createElement("div");
    postContainer.classList.add("post");

    const text = document.createElement("p");
    text.textContent = post.content;

    const reactionBar = document.createElement("div");
    reactionBar.classList.add("reactions");
    ["👍", "😂", "🔥", "💬"].forEach(emoji => {
      const span = document.createElement("span");
      span.textContent = emoji;
      span.classList.add("reaction");
      reactionBar.appendChild(span);
    });

    postContainer.appendChild(text);
    postContainer.appendChild(reactionBar);

    if (post.type === "media" && post.memoryId) {
      const mediaLink = document.createElement("a");
      mediaLink.href = `/memories.html#media-${post.memoryId}`;
      mediaLink.textContent = "View Memory";
      mediaLink.classList.add("media-link");
      postContainer.appendChild(mediaLink);
    }

    sections[post.type].appendChild(postContainer);
  });

  // Add post form handling
  document.querySelectorAll(".post-form").forEach(form => {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const input = this.querySelector("textarea");
      const newPost = input.value.trim();
      if (newPost) {
        const postEl = document.createElement("div");
        postEl.classList.add("post");
        postEl.innerHTML = `<p>${newPost}</p><div class="reactions"><span>👍</span> <span>😂</span> <span>🔥</span> <span>💬</span></div>`;
        this.parentElement.querySelector(".content").appendChild(postEl);
        input.value = "";
      }
    });
  });
});
