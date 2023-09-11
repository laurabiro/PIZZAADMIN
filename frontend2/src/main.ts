import "./style.css";
import axios from "axios";
import { z } from "zod";

// validation ------------------------------------------------------------------------------------------------------------------------------------

const PizzaSchema = z.object ({
  id: z.number(),
  name: z.string(),
  toppings: z.string().array(),
  url: z.string().optional(),
  status: z.boolean()
})
type Pizza = z.infer<typeof PizzaSchema>

const OrderSchema = z.object ({
  orderedPizzas: z.string().array(),
  name: z.string(),
  zip: z.string().optional(), 
  city: z.string().optional(),
  street: z.string().optional(),
  house: z.string().optional(),
  email: z.string().optional(),
  date: z.string().optional(),
  id: z.string(), 
  phone: z.string().optional(),
})
type OrderStatus = "new" | "pending";
type Order = z.infer<typeof OrderSchema> & { status: OrderStatus }

// app state ------------------------------------------------------------------------------------------------------------------------------------

let pizzas: Pizza[] = []
let selectedPizza: Pizza | null = null
let orders: Order[] = []
let selectedOrder: Order | null = null

// mutations ------------------------------------------------------------------------------------------------------------------------------------

const getPizzas = async () => {

  const response = await axios.get("http://localhost:3333/api/pizza")

  const result = PizzaSchema.array().safeParse(response.data)
  if (!result.success){
    pizzas = []
  }else{
    pizzas = result.data
  }    
}

const getOrders = async () => {

  const response = await axios.get("http://localhost:3333/api/admin")

  const result = OrderSchema.array().safeParse(response.data)
  if(!result.success){
    orders = []
  }else{
    orders = result.data.map((order) => ({ ...order, status: "new" }))
  }   
}

const deletePizza = async (id:number) => {

  const response = await axios.delete(`http://localhost:3333/api/pizza/${id}`)
  response
}

const postPizza = async (pizza: Pizza) => {

  if (!pizza) {
    console.error('not pizza')
    return;
  }
  
  try {
    const config = {
      method: "POST",
      body: JSON.stringify(pizza),
    }

    console.log(config)

    const response = await axios.post('http://localhost:3333/api/pizza', pizza)
    console.log('Data sent successfully:', response.data)
  } catch (error) {
    console.error('Error sending data:', error)
  }
}

const selectPizza = (id:number) => {
  selectedPizza = id ? pizzas.find(pizza => pizza.id === id) || null : {"id": 0, "name": "", "toppings": [], "url": "", "status": false}
}

const selectOrder = (id:string) => {
  selectedOrder = orders.find(order => order.id === id) || null
}

/* const update = (value:string, type:"name" ) => {
  selectedPizza![type] = value
} */

const toppingToString = (toppings: string[]) => {
  return toppings.join(" ,")
} 

// render ---------------------------------------------------------------------------------------------------------------------------------------

const renderMain = (pizzas: Pizza[]) => {
  
  const content = `
    <h1 class="text-black">PIZZAS</h1>

    <div id="mimi" class=" border-solid border-black border-2 p-3 flex-column items-between m-2 rounded-lg">
      <div class="flex flex-wrap">
      ${ pizzas.map(pizza => 
        `<div class="card flex-column bg-gray-500 gap-2 m-5 p-3 basis-100 flex-shrink-0 w-40 rounded-lg">
          <h1 class=" pl-2 mb-2" id="p-name">${pizza.name}</h1>
          <div class="flex justify-around">
            <button class="bg-white rounded-lg text-black p-1" id="e-${pizza.id}">edit</button>
            <button class="bg-white rounded-lg text-black p-1" id="d-${pizza.id}">delete</button>
            <input class="" type="checkbox"/>
          </div>
        </div>`
      ).join("")
      }
      </div>
      <div>
        <button id="create" class="text-black">create pizza +</button>
      </div>
    </div>`
  
  document.getElementById("card")!.innerHTML = content

  for(let i= 0; i< pizzas.length; i++){
    let p = pizzas[i].id
    document.getElementById(`e-${p}`)!.addEventListener("click", selectListener)
    document.getElementById(`d-${p}`)!.addEventListener("click", deleteListener)
  }

  document.getElementById("create")!.addEventListener("click", selectListener)
}

const renderEditPizza = (pizza: Pizza) => {

  const content = `
    <div class="flex-column" id="pipi"> 
        <div>
          <input class="m-2 text-black bg-white rounded-lg p-1 w-7/12" id="name" value="${pizza.name}" class=" bg-white text-black"/>
        </div>
        <div>
          <input class="m-2 text-black bg-white rounded-lg p-1 w-7/12" id="toppings" value="${toppingToString(pizza.toppings)}"/>
        </div>
        <div>
          <button class="m-2 bg-white text-black p-1 rounded-lg" id="save">SAVE</button>
        </div>
    </div>`

  document.getElementById("select")!.innerHTML = content
  
  document.getElementById("name")!.addEventListener("input", (event) => {
    selectedPizza!.name = (event.target as HTMLInputElement).value;
  })
  document.getElementById("toppings")!.addEventListener("input", (event) => {
    selectedPizza!.toppings = (event.target as HTMLInputElement).value.split(',') // Assuming toppings are comma-separated
  })
   
  document.getElementById("save")!.addEventListener("click", postListener)
}

const renderOrders = (orders: Order[]) => {

  const content = `
    <h1>CURRENT ORDERS</h1>
    
    ${orders.map(order =>
      `<div  class=" w-50 bg-base-100 shadow-xl m-2 p-3 rounded-lg">
        <div id="n-${order.id}" class=" bg-yellow-400 p-1 rounded-lg w-fit">${order.status}</div>
        <h2>${order.id}</h2>
        <p>${order.name}</p>
        <p> ordered amount: ${order.orderedPizzas.length} </p>
        <p>${order.date!.split(" ")[4]}</p>
        <p id="o-${order.id}" class=" cursor-pointer">open order</p>
      </div>`
      ).join("")}`

  document.getElementById("orders")!.innerHTML = content

  for(let i= 0; i< orders.length; i++){
    let id = orders[i].id
    document.getElementById(`o-${id}`)!.addEventListener("click", orderListener)

    const statusDiv = document.getElementById(`n-${id}`)
    statusDiv!.style.backgroundColor = orders[i].status === 'new' ? 'yellow' : 'aqua'
  }
}

const renderToDo = (order: Order) => {

  const content = `

    <div class=" p-2" id="didi"> 
      <div class=" text-black">
        <p>${order.id}</p>
        <p class=" font-bold">${order.orderedPizzas.join(" ,")}</p>
        <p>${order.date}</p>
        <p>${order.name}</p>
        <p> address: ${order.zip} , ${order.city} , ${order.street} , ${order.house} </p>
        <p>${order.email}</p>
        <p>${order.phone}</p>
      </div>  
      <div>
        <button id="s-${order.id}" class=" bg-slate-500 p-2 rounded-lg">SUBMIT</button>
        <button id="y-${order.id}" class=" bg-slate-500 p-2 rounded-lg">DONE</button>
      </div>
    </div>`
  
  document.getElementById("todo")!.innerHTML = content

  document.getElementById(`s-${order.id}`)!.addEventListener("click", submitListener)
  document.getElementById(`y-${order.id}`)!.addEventListener("click", doneListener)
}

const renderMenu = () => {

  const content = `

    <div class="flex-column text-black rounded-lg">
      <a href="http://localhost:5173/" class="m-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none"  stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
      </a>
      <a class="m-2 ">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none"  stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      </a>
      <a class="m-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none"  stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
      </a>
    </div>`

  document.getElementById("menu")!.innerHTML = content
}

// eventlisteners --------------------------------------------------------------------------------------------------------------------------------

const init = async () => {
  await getPizzas()
  await getOrders()
  
  renderMain(pizzas)
  renderOrders(orders)
  renderMenu()
}

const selectListener = (event: Event) => {
  selectPizza(+(event.target as HTMLButtonElement).id.split("-")[1])

  if (selectedPizza){
    renderEditPizza(selectedPizza)
  }    
}

const deleteListener = async (event: Event) => {
  let key = (event.target as HTMLButtonElement).id.split("-")[1]
  await deletePizza(+key)
  await getPizzas()

  renderMain(pizzas)
}

const postListener = () => {
  postPizza(selectedPizza!)
}

const orderListener = (event: Event) => {
  selectOrder((event.target as HTMLParagraphElement).id.split("-")[1])

  if(selectedOrder){
    renderToDo(selectedOrder)
  } 
}

const submitListener = (event: Event) => {
  selectOrder((event.target as HTMLParagraphElement).id.split("-")[1])

  const orderId = (event.target as HTMLButtonElement).id.split("-")[1]
  const orderToUpdate = orders.find((order) => order.id === orderId)

  if (orderToUpdate) {
    orderToUpdate.status = orderToUpdate.status === "new" ? "pending" : "new"
    renderOrders(orders)
  }
}

const doneListener = (event: Event) => {
  selectOrder((event.target as HTMLParagraphElement).id.split("-")[1])

  const orderId = (event.target as HTMLButtonElement).id.split("-")[1]
  const orderToUpdate = orders.find((order) => order.id === orderId)

  if (orderToUpdate) {
    renderOrders(orders)
  }
}

init()
