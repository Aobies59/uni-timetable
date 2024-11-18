const eventContainer = document.getElementById("event-container");

let classColors = {
  "Análisis de Datos": "red",
  "Arquitectura de Datos": "white",
  Ciberseguridad: "brown",
  "Dirección de Proyectos": "yellow",
  IAO: "pink",
  "Presentaciones Eficaces": "blue",
};

function getClassColor(className) {
  return classColors[className] ?? "grey";
}

document.getElementById("event-adder").addEventListener("click", () => {
  openForm();
});

let events = [];
function createEvent(eventName, className, day, month, year) {
  const event = {
    eventName: eventName,
    className: className,
    day: day,
    month: month,
    year: year,
    element: undefined,
  };

  for (currEvent of events) {
    if (
      currEvent["eventName"] == event["eventName"] &&
      currEvent["className"] == event["className"]
    ) {
      return;
    }
  }

  const eventElement = document.createElement("div");
  eventElement.className = "event";

  const eventNameElement = document.createElement("p");
  eventNameElement.innerHTML = eventName;
  eventNameElement.className = "event-name";
  eventElement.appendChild(eventNameElement);

  const classElement = document.createElement("div");
  classElement.className = "class";

  const classMarkerElement = document.createElement("div");
  classMarkerElement.className = "class-marker";
  classMarkerElement.style.backgroundColor = getClassColor(className);
  classElement.appendChild(classMarkerElement);

  const classNameElement = document.createElement("p");
  classNameElement.className = "class-name";
  classNameElement.innerHTML = className;
  classElement.appendChild(classNameElement);

  eventElement.appendChild(classElement);

  const currentDate = new Date();
  const targetDate = new Date(year, month - 1, day);
  const timeDifference = targetDate - currentDate;
  const daysRemaining = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
  const eventTimerElement = document.createElement("div");
  eventTimerElement.className = "event-timer";
  if (daysRemaining == 1) {
    eventTimerElement.innerHTML = daysRemaining + " día";
  } else if (daysRemaining > 1 || daysRemaining == 0) {
    eventTimerElement.innerHTML = daysRemaining + " días";
  } else {
    return;
  }
  eventElement.appendChild(eventTimerElement);

  const closeButtonElement = document.createElement("button");
  closeButtonElement.className = "event-close";
  closeButtonElement.innerHTML = "&#x2715";
  closeButtonElement.addEventListener("click", () => {
    eventContainer.removeChild(eventElement);
    deleteCachedEvent(eventName, className);
    fetch("/delete-event", {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
      },
      body: `${eventName};${className}`,
    }).catch((error) => {
      console.error("Server error in deleting event: ", error);
    });
  });
  eventElement.appendChild(closeButtonElement);

  eventContainer.removeChild(document.getElementById("event-adder"));

  const eventAdder = document.createElement("event-adder");
  eventAdder.id = "event-adder";
  eventAdder.addEventListener("click", () => {
    openForm();
  });
  eventContainer.appendChild(eventElement);
  eventContainer.appendChild(eventAdder);

  event["element"] = eventElement;
  events.push(event);
}

const menuColumn = document.getElementById("menu");
let classActive = new Object({});
let menuButtons = [];
function initMenuColumn() {
  for (const currClassName in classColors) {
    const currClassColor = classColors[currClassName];
    if (currClassColor == undefined) {
      continue;
    }

    const classContainer = document.createElement("div");
    classContainer.className = "class";

    const classMarker = document.createElement("div");
    classMarker.className = "classMarker";
    classMarker.style.backgroundColor = currClassColor;
    classContainer.appendChild(classMarker);

    const className = document.createElement("p");
    className.className = "className";
    className.innerHTML = currClassName;
    classContainer.appendChild(className);

    classActive[currClassName] = false;

    classContainer.addEventListener("click", () => {
      let state = false;
      for (const currClassActiveName in classActive) {
        if (currClassActiveName == currClassName) {
          state = !classActive[currClassName];
          classActive[currClassName] = state;
        } else {
          classActive[currClassActiveName] = false;
        }
      }

      if (state) {
        for (currEvent of events) {
          if (currEvent["className"] == currClassName) {
            currEvent["element"].style.display = "grid";
            currEvent["element"].style.gridRow = "";
            currEvent["element"].style.gridColumn = "";
          } else {
            currEvent["element"].style.display = "none";
          }
        }
        for (button of menuButtons) {
          button.classList.remove("class-active");
        }
        classContainer.classList.add("class-active");
      } else {
        for (currEvent of events) {
          currEvent["element"].style.display = "grid";
          currEvent["element"].style.gridRow = "";
          currEvent["element"].style.gridColumn = "";
        }
        classContainer.classList.remove("class-active");
        triggerSort();
      }
    });

    menuColumn.appendChild(classContainer);
    menuButtons.push(classContainer);
  }
}

function deleteCachedEvent(eventName, className) {
  for (i in events) {
    currEvent = events[i];
    if (
      currEvent["eventName"] == eventName &&
      currEvent["className"] == className
    ) {
      events.splice(i, 1);
    }
  }
}

function fetchEvents() {
  fetch("/events.csv")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Error fetching events.csv: " + response.statusText);
      }
      return response.text();
    })
    .then((data) => {
      const lines = data.split("\n").filter((line) => line.length > 0);
      for (currLine of lines) {
        const lineElements = currLine
          .split(",")
          .filter((element) => element.length > 0);
        if (lineElements.length != 5) {
          console.log(lineElements.length);
          console.error("Element with incorrect format: " + currLine);
          continue;
        }
        const eventName = lineElements[0];
        const className = lineElements[1];
        if (
          isNaN(lineElements[2]) ||
          isNaN(lineElements[3]) ||
          isNaN(lineElements[4])
        ) {
          console.error("Element with incorrect format", currLine);
          continue;
        }

        const day = Number(lineElements[2]);
        const month = Number(lineElements[3]);
        const year = Number(lineElements[4]);

        createEvent(eventName, className, day, month, year);
      }
    });
}

const form = document.querySelector("form");
const formBackground = document.getElementById("form-background");
const formCloseButton = document.getElementById("form-close");

function openForm() {
  formBackground.style.visibility = "visible";
}

function closeForm() {
  formBackground.style.visibility = "hidden";
}

formCloseButton.addEventListener("click", (event) => {
  event.preventDefault();

  closeForm();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const eventName = form.querySelector("input#eventName").value;
  const className = form.querySelector("select#className").value;
  const date = form.querySelector("input#date").value;
  if (eventName == "" || className == "" || date == "") {
    window.alert("Faltan secciones del formulario");
    return;
  }
  const formattedDate = new Date(date);
  const retValue = await addEvent(
    eventName,
    className,
    formattedDate.getUTCDate(),
    formattedDate.getUTCMonth() + 1,
    formattedDate.getUTCFullYear(),
  );
  if (retValue == 0) {
    closeForm();
  } else if (retValue == -1) {
    window.alert("Evento con ese nombre en esa asignatura ya existe");
  } else {
    window.alert("Error del servidor, vuelva a intentarlo");
  }
});

async function addEvent(eventName, className, day, month, year) {
  const response = await fetch("/create-event", {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
    },
    body: `${eventName},${className},${day},${month},${year}`,
  });

  if (!response.ok) {
    throw new Error("Server error creating event: " + response.statusText);
  }

  const responseText = await response.text();
  if (responseText == "Event already exists") {
    return -1;
  } else {
    createEvent(eventName, className, day, month, year);
    return 0;
  }
}

function initSortMenu() {
  sortEvents("date", false);
  const triggerMenu = () => {
    if (menuActive) {
      sortMenu.style.height = 0;
      sortMenu.style.visibility = "hidden";
      sortMenuBackground.style.visibility = "hidden";
    } else {
      sortMenu.style.height = "min-content";
      sortMenu.style.visibility = "visible";
      sortMenuBackground.style.visibility = "visible";
    }
    menuActive = !menuActive;
  };

  const sortButton = document.getElementById("sort-button");
  const sortMenu = document.getElementById("sort-menu");
  const sortMenuBackground = document.getElementById("sort-menu-background");
  let menuActive = false;
  sortButton.addEventListener("click", triggerMenu);
  sortMenuBackground.addEventListener("click", triggerMenu);

  const menuItems = sortMenu.children;
  const menuItemsInfo = new Object({});
  const sortMethod = document.getElementById("sort-method");
  const sortOrder = document.getElementById("sort-order");
  for (const currMenuItem of menuItems) {
    menuItemsInfo[currMenuItem.id] = false;

    currMenuItem.addEventListener("click", () => {
      const currSortMethod = sortMethod.innerHTML;
      const newSortMethod =
        currMenuItem.getElementsByClassName("sort-method")[0].innerHTML;
      if (currSortMethod == newSortMethod) {
        menuItemsInfo[currMenuItem.id] = !menuItemsInfo[currMenuItem.id];
      }
      const rotationDegrees = menuItemsInfo[currMenuItem.id] ? 180 : 0;
      currMenuItem.getElementsByClassName("sort-order")[0].style.transform =
        `rotate(${rotationDegrees}deg)`;
      sortOrder.style.transform = `rotate(${rotationDegrees}deg)`;
      sortMethod.innerHTML = newSortMethod;

      triggerMenu();
      sortEvents(currMenuItem.id, menuItemsInfo[currMenuItem.id]);
    });
  }
}

let sortMethod = "date";
let sortAscending = false;
function sortEvents(newSortMethod, ascending) {
  sortMethod = newSortMethod;
  sortAscending = ascending;
  let sortedEvents = [];
  if (newSortMethod == "date") {
    let dateSortedEvents = [];
    for (currEvent of events) {
      const currentDate = new Date();
      const targetDate = new Date(
        currEvent.year,
        currEvent.month - 1,
        currEvent.day,
      );
      const timeDifference = targetDate - currentDate;
      const currDateSortedEvent = {
        timeDifference: timeDifference,
        element: currEvent.element,
      };
      dateSortedEvents.push(currDateSortedEvent);
    }
    if (ascending) {
      sortedEvents = dateSortedEvents.sort((a, b) => {
        return b.timeDifference - a.timeDifference;
      });
    } else {
      sortedEvents = dateSortedEvents.sort((a, b) => {
        return a.timeDifference - b.timeDifference;
      });
    }
  } else {
    sortedEvents = events;
  }

  const maxCols = 4;
  let currCol = 1;
  let currRow = 1;
  for (currEvent of sortedEvents) {
    currEvent.element.style.gridRow = currRow;
    currEvent.element.style.gridColumn = currCol;
    currCol += 1;
    if (currCol > maxCols) {
      currCol = 1;
      currRow += 1;
    }
  }
}

function triggerSort() {
  sortEvents(sortMethod, sortAscending);
}

fetchEvents();
initMenuColumn();
initSortMenu();
setTimeout(triggerSort, 10);
