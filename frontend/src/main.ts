import "./style.css"
import axios from "axios"
import { z } from "zod"

const PizzaSchema = z.object ({
  id: z.number(),
  name: z.string(),
  toppings: z.string().array(),
  url: z.string(),
})

type Pizza = z.infer<typeof PizzaSchema>

type Order = {
  name: string,
  zipCode: string,
  city: string,
  street: string,
  houseNumber: string,
  phone: string,
  email:string,
  items: {
    id: number,
    amount: number
  }[]
}

// app state
let isLoading = false
let pizzas: Pizza[] = []
let selectedPizza: Pizza | null = null
let amount = 0
let order: Order | null = null
let isSending = false

// mutation

const selectCard = document.getElementById("selected") as HTMLDivElement
const orderCard = document.getElementById("order") as HTMLDivElement
selectCard.style.display = "none"
orderCard.style.display = "none"


const getPizzas = async () => {
  isLoading = true

  const response = await axios.get("http://localhost:3333/api/pizza")
  isLoading = false

  const result = PizzaSchema.array().safeParse(response.data)
  if (!result.success)
    pizzas = []
  else
    pizzas = result.data
}

const postPizzas = async () => {
  const date = new Date().toUTCString();
  const idd = (date:string) => {
    return "#" + date.split(" ")[4].split(":").join("")
  }
  
  isSending = true

    const name = order!.name;
    const zipCode = order!.zipCode;
    const city = order!.city;
    const street = order!.street;
    const houseNumber = order!.houseNumber;
    const phone = order!.phone;
    const email = order!.email;
    const id = idd(date)

    const orderField = {  
      "orderedPizzas":getOrderDetails(),
      "name": name,
      "zip": zipCode,
      "city": city,
      "street":street,
      "house": houseNumber,
      "phone": phone,
      "email": email,
      "date":date,
      "id":id,
    }
  
  try {
    const config = {
      method: "POST",
      body: JSON.stringify(orderField),
    }
    console.dir(config)
    const response = await axios.post('http://localhost:3333/api/order', orderField)
    console.log('Data sent successfully:', response.data)
  } catch (error) {
    console.error('Error sending data:', error)
  }
}

const selectPizza = (id: number) => {
  selectedPizza = pizzas.find(pizza => pizza.id === id) || null
}

const updateAmount = (num: number) => {
  amount = num
}

const deleteItem = (id:number) => {
  if (order) { order = {
    name: order.name,
    zipCode: order.zipCode,
    city: order.city,
    street: order.street,
    houseNumber: order.houseNumber,
    phone: order.phone,
    email:order.email,
    items: [
      ...order.items.filter(item => item.id !== id)
    ]
  } 
}
}

const updateOrderWithItem = () => {
  order = order ? {
    name: order.name,
    zipCode: order.zipCode,
    city: order.city,
    street: order.street,
    houseNumber: order.houseNumber,
    phone: order.phone,
    email:order.email,
    items: [
      ...order.items.filter(item => item.id !== selectedPizza!.id),
      { id: selectedPizza!.id, amount }
    ]
  } : {
    name:"",
    zipCode:"",
    city: "",
    street: "",
    houseNumber: "",
    phone: "",
    email:"",
    items: [
      { id: selectedPizza!.id, amount }
    ]
  }
}

const getOrderDetails = () => {
  const listedPizzas = document.getElementsByClassName("ordering-pizza")
  let i = 0
  let result:string[] = []
  while(listedPizzas[i] !== undefined){
    result = [...result, listedPizzas[i].innerHTML]
    i++
  }
  return result
}

const deletePost = () => {
  if (order) { order = {
    name: "",
    zipCode: "",
    city: "",
    street: "",
    houseNumber: "",
    phone: "",
    email:"",
    items: [
    ]
  } 
}
}

const updateInput = (value:string, type:"name" | "zipCode" | "city" | "street" | "houseNumber" | "phone" | "email") => {
  order![type] = value
}


// render
const renderList = (pizzas: Pizza[]) => {
  const container = document.getElementById("list")!
  
  for (const pizza of pizzas) {
    const pizzaParagraph = document.createElement("p")
    pizzaParagraph.innerText = pizza.name
    pizzaParagraph.id = "" + pizza.id
    container.appendChild(pizzaParagraph)
    pizzaParagraph.addEventListener("click", selectListener)
  }
}

const renderSelected = (pizza: Pizza) => {
  const content = `
    <div id="selected">
      <h1 id="p-name">${pizza.name}</h1>
      <p class="toppings">${pizza.toppings}</p>
      <img id="img" src="${pizza.url}" />
      <input type="number" placeholder = "1" id="amount" min = "1" />
      <button id="add">Add to order</button>
    </div>
  `
  document.getElementById("selected")!.innerHTML = content
  document.getElementById("add")!.addEventListener("click", addListener);
  (document.getElementById("amount") as HTMLInputElement).addEventListener("change", changeListener)
}

const renderOrder = (order: Order) => {
  console.log(order)
  const content = `
    <div>
      <h1 id="yo">Your order</h1>
      ${order.items.map(item => `
        <div class="orderline">
          <p class="ordering-pizza">${item.amount} x ${pizzas.find(pizza => pizza.id === item.id)!.name}</p>
          <button id="x-${item.id}">X</button>
        </div>
      `).join('')}
      <input placeholder="Name" id="name" value="${order.name}"/>
      <input placeholder="Zip code" id="zip" value="${order.zipCode}"/>
      <input placeholder="city" id="city" value="${order.city}"/>
      <input placeholder="street" id="street" value="${order.street}"/>
      <input placeholder="house number" id="house" value="${order.houseNumber}"/>
      <input placeholder="phone number" id="phone" value="${order.phone}"/>
      <input placeholder="email address" id="email" value="${order.email}"/>
      <button id="send">Send order</button>
    </div>
  `
  
  document.getElementById("order")!.innerHTML = content

  for (let i = 0; i < order.items.length; i++) {
    let item = order.items[i]
      document.getElementById(`x-${item.id}`)!.addEventListener("click", deleteListener)
  }

  document.getElementById("name")!.addEventListener("input", (event) => {
    updateInput((event.target as HTMLInputElement).value, "name")
  })
  document.getElementById("zip")!.addEventListener("input", (event) => {
    updateInput((event.target as HTMLInputElement).value, "zipCode")
  })
  document.getElementById("city")!.addEventListener("input", (event) => {
    updateInput((event.target as HTMLInputElement).value, "city")
  })
  document.getElementById("street")!.addEventListener("input", (event) => {
    updateInput((event.target as HTMLInputElement).value, "street")
  })
  document.getElementById("house")!.addEventListener("input", (event) => {
    updateInput((event.target as HTMLInputElement).value, "houseNumber")
  })
  document.getElementById("phone")!.addEventListener("input", (event) => {
    updateInput((event.target as HTMLInputElement).value, "phone")
  })
  document.getElementById("email")!.addEventListener("input", (event) => {
    updateInput((event.target as HTMLInputElement).value, "email")
  })

  document.getElementById("send")!.addEventListener("click", postListener)
  document.getElementById("send")!.addEventListener("click", deletePostListener)
}

// eventListeners
const init = async () => {
  await getPizzas()
  if (pizzas.length)
    renderList(pizzas)
}

const selectListener = (event: Event) => {
  selectPizza(+(event.target as HTMLParagraphElement).id)
  if (selectedPizza)
    renderSelected(selectedPizza)

  selectCard.style.display = "block"
}

const changeListener = (event: Event) => {
  updateAmount(+(event.target as HTMLInputElement).value)
}

const addListener = () => {
  updateOrderWithItem()
  if (order)
    renderOrder(order)

  orderCard.style.display = "block"
}

const deleteListener = (event: Event) => {
  deleteItem(+(event.target as HTMLButtonElement).id.split("-")[1]);
  if (order) {
    renderOrder(order)
  }
}

const postListener = () => {
  postPizzas()
  if(order){
    renderOrder(order)
  }
}

const deletePostListener = () => {
  deletePost()
  orderCard.style.display = "none"
  selectCard.style.display = "none"
}

init()