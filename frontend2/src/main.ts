import "./style.css";
import axios from "axios";
import { z } from "zod";

// validation
const PizzaSchema = z.object ({
  id: z.number(),
  name: z.string(),
  toppings: z.string().array(),
  url: z.string(),
  status: z.boolean()
})

type Pizza = z.infer<typeof PizzaSchema>


const OrderSchema = z.object ({
  orderedPizzas: z.string().array(),
  name: z.string(),
  /*zipCode: z.string(), 
  city: z.string(),
  street: z.string(),
  houseNumber: z.string(),
  email: z.string(),
  date: z.string(),
  */id: z.string(), 
  /* phoneNumber: z.string(), */
})

type Order = z.infer<typeof OrderSchema>


// app state

let pizzas: Pizza[] = []
let selectedPizza: Pizza | null = null
let orders: Order[] = []
let selectedOrder: Order | null = null


// mutations

const getPizzas = async () => {

  const response = await axios.get("http://localhost:3333/api/pizza")

  const result = PizzaSchema.array().safeParse(response.data)
  if (!result.success)
    pizzas = []
  else
    pizzas = result.data
}

const getOrders = async () => {

  const response = await axios.get("http://localhost:3333/api/admin")

  const result = OrderSchema.array().safeParse(response.data)
  console.log(response.data[0])
  if(!result.success)
    orders = []
  else
    orders = result.data 
}

const deletePizza = async (id:number) => {
  const response = await axios.delete(`http://localhost:3333/api/pizza/${id}`)
  
}

const selectPizza = (id:number) => {
  selectedPizza = id ? pizzas.find(pizza => pizza.id === id) || null : {"id": 0, "name": "", "toppings": [], "url": "", "status": false}
}

// render

const renderMain = (pizzas: Pizza[]) => {
  
  const content = `
    <h1 class="text-black">PIZZAS</h1>
    <div id="mimi" class=" border-solid border-black border-2 p-3 flex items-between flex-wrap">
      <div class="flex">
      ${ pizzas.map(pizza => 
        `<div class="card flex-column bg-gray-500 gap-2 m-5 p-3 basis-100 flex-shrink-0">
          <h1 id="p-name">${pizza.name}</h1>
          <div>
            <button id="e-${pizza.id}">edit</button>
            <button id="d-${pizza.id}">delete</button>
          </div>
        </div>`
      ).join("")
      }
      </div>
      <div>
        <button class="text-black">create pizza</button>
      </div>
    </div>`
  
  document.getElementById("card")!.innerHTML = content

  for(let i= 0; i< pizzas.length; i++){
    let p = pizzas[i].id
    document.getElementById(`e-${p}`)!.addEventListener("click", selectListener)
    document.getElementById(`d-${p}`)!.addEventListener("click", deleteListener)
  }
}

const renderEditPizza = (pizza: Pizza) => {

  const content = `
    <div id="pipi"> 
        <div>
          <input/>
        </div>
        <div>
          <input/>
        </div>
        <div>
          <button>SAVE</button>
        </div>
    </div>`

  document.getElementById("select")!.innerHTML = content
}

const renderOrders = (orders: Order[]) => {

  const content = `
    <h1>CURRENT ORDERS</h1>
    ${orders.map(order =>
      `<div class="notifications text-black">
        <h2>${order.id}</h2>
        <p>${order.name}</p>
        <p>ordered amount: ${order.orderedPizzas.length} </p>
      </div>`
      ).join("")}`

  document.getElementById("orders")!.innerHTML = content

}

const renderMenu = () => {
  const content = `
  <div class=" text-white">
    <button class="m-2 bg-black">P</button>
  </div>
  <div class=" text-white">
    <button class="m-2 bg-black">Q</button>
  </div>
  `
  document.getElementById("menu")!.innerHTML = content
}

// eventlisteners

const init = async () => {
  await getPizzas()
  await getOrders()
  
  renderMain(pizzas)
  console.log(pizzas)
  renderOrders(orders)
  console.log(orders)
  renderMenu()

}

const selectListener = (event: Event) => {
  selectPizza(+(event.target as HTMLButtonElement).id)
  console.log(event.target)
  console.log((event.target as HTMLButtonElement).id)

  if (selectedPizza)
    renderEditPizza(selectedPizza)
}

const deleteListener = async (event: Event) => {
  let leszarom = (event.target as HTMLButtonElement).id.split("-")[1]
  await deletePizza(+leszarom)
  console.log(leszarom)

  await getPizzas()
  renderMain(pizzas)
}



init()
