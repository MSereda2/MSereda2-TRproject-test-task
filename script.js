const shelfModalCtrl = (() => {
  const url = "https://api.jsonbin.io/b/5e6b40e207f1954acedf3427/1";

  return {
    getShelf: async () => {
      const response = await fetch(url, {
        headers: {
          "Secret-key":
            "$2b$10$zeNmy2u803VjpcCj2JEa8uzC4t9YjXuLm3izVwWlCLigtPBES89dG"
        }
      });
      const data = await response.json();
      return data;
    }
  };
})();

const shelfUICtrl = (() => {
  const DOMstrings = {
    shelfsList: ".shelf",
    rack_area: ".rack",
    products: ".product"
  };

  return {
    renderShelfs: shelfs => {
      shelfs.forEach(el => {
        el.products.sort((a, b) => {
          return a.productOrder - b.productOrder;
        });
        const markup = `
                    <div class="rack" id="${el.shelfId}">
                    <h1 class="rack_number">${el.shelfOrder}</h1>
                        ${el.products.map(
                          product =>
                            `
                            <div data-order="${product.productOrder}" class="product ${el.shelfId}" id="${product.productId}" draggable="true">
                                <img src="${product.productUrl}" alt="">
                            </div>
                            `
                        )}
                    </div>  
                `;
        document
          .querySelector(DOMstrings.shelfsList)
          .insertAdjacentHTML("beforeend", markup);
      });
    },
    getDOMstrings: () => {
      return DOMstrings;
    },
    getMousePosition: (rack, x) => {
      const allProducts = [...rack.querySelectorAll(".product:not(.draggin)")];

      return allProducts.reduce(
        (closest, child) => {
          const box = child.getBoundingClientRect();
          const offset = x - box.left - box.width / 2;
          if (offset < 0 && offset > closest.offset) {
            return {
              offset: offset,
              element: child
            };
          } else {
            return closest;
          }
        },
        { offset: Number.NEGATIVE_INFINITY }
      ).element;
    }
  };
})();

const shelfControler = (async (shelfModal, shelfUI) => {
  const DOM = shelfUI.getDOMstrings();
  let state = {};
  //0. state of the app
  const data = await shelfModal.getShelf();
  console.log(data);
  state.shelfs = data;

  const str = `<p id="object"> ${JSON.stringify(data, null, 4)}</p>`;
  var markup = document.createElement("pre");
  markup.innerHTML = str;
  document.querySelector(".object_data").appendChild(markup);

  //1. render shelfs with products
  shelfUI.renderShelfs(state.shelfs);

  //2. drag and drop products between racks
  const products = document.querySelectorAll(DOM.products);
  const racks = document.querySelectorAll(DOM.rack_area);

  products.forEach(item => {
    item.addEventListener("dragstart", e => {
      item.classList.add("draggin");
    });

    item.addEventListener("dragend", e => {
      item.classList.remove("draggin");
    });
  });

  racks.forEach(rack => {
    rack.addEventListener("dragover", e => {
      e.preventDefault();
      // get the element that is being dragged
      const draggable = document.querySelector(".draggin");
      const parentDiv = draggable.parentElement;
      // shelfs id
      const previousShelfId = draggable.className.split(" ")[1];
      const movedShelfId = parentDiv.id;

      // STEP 1: remove the product from the previous array
      const previousShelf = state.shelfs.find(val => {
        return parseInt(val.shelfId) === parseInt(previousShelfId);
      });
      const previousShelfIdx = state.shelfs.indexOf(previousShelf);
      const product = state.shelfs[previousShelfIdx].products.find(val => {
        return parseInt(val.productId) === parseInt(draggable.id);
      });
      const productIdx = state.shelfs[previousShelfIdx].products.indexOf(
        product
      );
      if (productIdx !== -1) {
        state.shelfs[previousShelfIdx].products.splice(productIdx, 1);
      }

      // STEP 2: add the product to the new shelf's array
      state.shelfs.forEach(val => {
        // console.log(val.products);
        if (parseInt(val.shelfId) === parseInt(movedShelfId)) {
          val.products.push(product);
        }
      });

      // STEP 3: render the updated object
      const domObj = document.getElementById("object");
      const asd = `<div> ${JSON.stringify(state.shelfs, null, 4)}</div>`;
      domObj.innerHTML = asd;

      const afterElement = shelfUI.getMousePosition(rack, e.clientX);

      if (afterElement === undefined) {
        rack.appendChild(draggable);
      } else {
        rack.insertBefore(draggable, afterElement);
      }

      // update the current shelf id
      draggable.className = "product " + movedShelfId + " draggin";
    });
  });

  //3. render state to ui and spy for any changes
})(shelfModalCtrl, shelfUICtrl);
