document.getElementById('organizerVerificationForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const formData = {
    organization: document.getElementById('organization').value,
    experience: document.getElementById('experience').value,
    website: document.getElementById('website').value
  };

  try {
    const response = await fetch('/api/verify/organizer', {
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
      window.location.href = 'organizer.html';
    } else {
      alert('Error: ' + data.message);
    }
  } catch (err) {
    alert('Submission failed. Please try again.');
    console.error(err);
  }
});