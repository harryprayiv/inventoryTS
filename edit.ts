(async () => {
  const jsonEditor = document.getElementById("jsonEditor") as HTMLTextAreaElement;
  const saveChanges = document.getElementById("saveChanges") as HTMLButtonElement;
  const goBack = document.getElementById("goBack") as HTMLButtonElement;

  let json: any;

  async function loadJson() {
    const customJson = localStorage.getItem("customJson");
    if (customJson) {
      json = JSON.parse(customJson);
    } else {
      const response = await fetch("inventory.json");
      json = await response.json();
    }
    jsonEditor.value = JSON.stringify(json, null, 2);
  }

  await loadJson();

  jsonEditor.addEventListener("input", () => {
    try {
      json = JSON.parse(jsonEditor.value);
      jsonEditor.classList.remove("error");
    } catch (error) {
      jsonEditor.classList.add("error");
      console.error("Invalid JSON");
    }
  });

  saveChanges.addEventListener("click", () => {
    localStorage.setItem("customJson", JSON.stringify(json));
    window.location.href = "index.html";
  });

  goBack.addEventListener("click", () => {
    window.location.href = "index.html";
  });
})();