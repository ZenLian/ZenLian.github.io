const tocButton = document.getElementById("toc-button");
const tocContent = document.getElementById("toc-content");
function toggleTOC() {
  if (tocContent.style.display === "" || tocContent.style.display === "block") {
    tocContent.style.display = "none";
  } else {
    tocContent.style.display = "";
  }
}
tocButton.onclick = toggleTOC;
