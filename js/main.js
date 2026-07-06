function handleContactSubmit(e) {
  e.preventDefault();
  const status = document.getElementById('form-status');
  status.classList.add('show');
  e.target.reset();
  return false;
}
