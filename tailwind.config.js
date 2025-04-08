/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "404.html",
    "_layouts/default.html",
    "_layouts/home.html",
    "_layouts/post.html",
    "_includes/header.html",
    "_includes/footer.html",
    "_includes/comments.html"],
  darkMode: 'media',
  theme: {
    fontFamily: {
      'serif': ['Petrona', '"Helvetica Neueu"', 'helvetica', '"Apple Color Emoji"', 'arial', 'sans-serif']
    },
    extend: {},
  },
  plugins: [],
}

