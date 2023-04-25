var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
(() => __awaiter(this, void 0, void 0, function* () {
    const jsonEditor = document.getElementById("jsonEditor");
    const saveChanges = document.getElementById("saveChanges");
    const goBack = document.getElementById("goBack");
    let json;
    function loadJson() {
        return __awaiter(this, void 0, void 0, function* () {
            const customJson = localStorage.getItem("customJson");
            if (customJson) {
                json = JSON.parse(customJson);
            }
            else {
                const response = yield fetch("inventory.json");
                json = yield response.json();
            }
            jsonEditor.value = JSON.stringify(json, null, 2);
        });
    }
    yield loadJson();
    jsonEditor.addEventListener("input", () => {
        try {
            json = JSON.parse(jsonEditor.value);
            jsonEditor.classList.remove("error");
        }
        catch (error) {
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
}))();
