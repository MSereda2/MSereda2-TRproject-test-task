
const shelfModalCtrl = (() => {

    const url = 'https://api.jsonbin.io/b/5e6b40e207f1954acedf3427/1';

    return {
       getShelf: async () => {
            const response = await fetch(url, {
                headers: {
                'Secret-key': '$2b$10$zeNmy2u803VjpcCj2JEa8uzC4t9YjXuLm3izVwWlCLigtPBES89dG'    
                }
            });
            const data = await response.json();
            return data;
       }
    }
    
})()

const shelfUICtrl = (() => {
    const DOMstrings = {
        shelfsList: '.shelf',
        rack_area: '.rack',
        products: '.product' 
    }

   return {
        renderShelfs: (shelfs) => {
            shelfs.forEach(el => {
                const markup = `
                    <div class="rack" id="${el.shelfId}">
                    <h1 class="rack_number">${el.shelfOrder}</h1>
                        ${el.products.map(product => (
                            `
                            <div data-order="${product.productOrder}" class="product" id="${product.productId}" draggable="true">
                                <img src="${product.productUrl}" alt="">
                            </div>
                            `
                        ))}
                    </div>  
                `;
                document.querySelector(DOMstrings.shelfsList).insertAdjacentHTML('beforeend', markup)
            })
        },
        getDOMstrings: () => {
            return DOMstrings
        },
        getMousePosition: (rack, x) => {
            const allProducts = [...rack.querySelectorAll('.product:not(.draggin)')];

            return allProducts.reduce((closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = x - box.left - box.width / 2;
                if(offset < 0  && offset > closest.offset) {
                    return {
                        offset: offset,
                        element: child
                    }
                } else {
                    return closest
                }
            }, {offset: Number.NEGATIVE_INFINITY}).element
        }
   }
})()

const shelfControler = (async (shelfModal, shelfUI) => {
   const state = {};
   const DOM = shelfUI.getDOMstrings();

   //0. state of the app
   const data = await shelfModal.getShelf()
   state.shelfs = data

   //1. render shelfs with products
   shelfUI.renderShelfs(state.shelfs)

   //2. drag and drop products between racks
   const products = document.querySelectorAll(DOM.products);
   const racks = document.querySelectorAll(DOM.rack_area);
    
   products.forEach(item => {

        item.addEventListener('dragstart', (e) => {
            item.classList.add('draggin')
        })

        item.addEventListener('dragend', (e) => {
            item.classList.remove('draggin')
        })
   })

   racks.forEach(rack => {
       rack.addEventListener('dragover', (e) => {
           e.preventDefault();
           const draggable = document.querySelector('.draggin');
           const afterElement = shelfUI.getMousePosition(rack, e.clientX);
           if(afterElement == null) {
                rack.appendChild(draggable);
           } else {
               rack.insertBefore(draggable, afterElement)
           }
           console.log(afterElement)
           
       })
   })

  

   //3. render state to ui and spy for any changes

})(shelfModalCtrl, shelfUICtrl)