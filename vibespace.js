
document.addEventListener("DOMContentLoaded", () => {
  const posts = [
    { content: "Who’s going to Afrobeats Night this Friday? 🎶", type: "event" },
    { content: "My top 3 food events in Nairobi this semester 🍽️👇", type: "list" },
    { content: "Anyone else think the DJ last night was insane? 🔥", type: "reaction" },
    { content: "Missed the event? Here’s what it looked like 🎥👇", type: "memory" },
    { content: "Any jazz heads here? Drop your favorite local artist 🎷", type: "community" }
  ];

  const generalFeed = document.querySelector(".general-feed");
  const threads = document.querySelector(".event-threads");
  const communities = document.querySelector(".communities");
  const mediaReactions = document.querySelector(".media-reactions");

  posts.forEach(post => {
    const el = document.createElement("p");
    el.textContent = post.content;

    switch (post.type) {
      case "event":
      case "reaction":
        threads.appendChild(el);
        break;
      case "list":
      case "community":
        communities.appendChild(el);
        break;
      case "memory":
        mediaReactions.appendChild(el);
        break;
      default:
        generalFeed.appendChild(el);
    }
  });
});
