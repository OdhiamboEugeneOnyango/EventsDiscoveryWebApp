document.getElementById('artistVerificationForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const formData = {
    stageName: document.getElementById('stageName').value,
    genre: document.getElementById('genre').value,
    bio: document.getElementById('bio').value,
    portfolioLink: document.getElementById('portfolioLink').value
  };

  try {
    const response = await fetch('/api/verify/artist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify(formData)
    });

    const data = await response.json();
    if (response.ok) {
      alert('Verification request submitted successfully!');
      window.location.href = 'artist.html';
    } else {
      alert('Error: ' + data.message);
    }
  } catch (err) {
    alert('Submission failed. Please try again.');
    console.error(err);
  }
});