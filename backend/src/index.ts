import express from "express"
import type { Request, Response } from "express"
import cors from "cors"
import fs from "fs"
import { z } from "zod"
import path from "path"

const server = express()
server.use(cors())
server.use(express.static("database"))
server.use(express.json())

/* const fileUpload = require("express-fileupload"); */
/* app.use(fileUpload()) */
/* app.use("/database/pictures", express.static("dist/assets")) */

const PizzaSchema = z.object ({

  id: z.number(),
  name: z.string(),
  toppings: z.string().array(),
  url: z.string(),
  status: z.boolean()

}).array()
type PizzaList = z.infer<typeof PizzaSchema>

// USER & ADMIN
server.get("/api/pizza", async (req: Request, res: Response) => {
 
  const pizzaData = await JSON.parse(fs.readFileSync('database/pizza.json', 'utf-8'))
  return res.json(pizzaData)
})

// USER

server.post('/api/order', async (req: Request, res: Response) => {
  const fileData = req.body

  try {
    const fileDataString = JSON.stringify(fileData, null, 2) // Adjust spacing as needed
    
    const uploadPath = __dirname + '/../database/orders/' + `${req.body.id}.json`
    fs.writeFileSync(uploadPath, fileDataString)

    res.send(fileDataString)

  } catch (error) {
    console.error('Error writing to file:', error)
    res.status(500).send('Error writing to file')
  }
})

// ADMIN

const findLastId = (pizzaData:PizzaList) => {

  if (pizzaData.length === 0) {
    return 1 // If there are no pizzas, start with ID 1
  }
  const lastPizza = pizzaData[pizzaData.length - 1];
  return lastPizza.id;
}

server.post('/api/pizza', async (req:Request, res:Response) => {
  
  try {
    const uploadPath = __dirname + '/../database/' + 'pizza.json'
    const pizzaData = JSON.parse(fs.readFileSync(uploadPath, 'utf-8'))
    const newPizzaId = findLastId(pizzaData) + 1
    const newPizza = {
      id: newPizzaId,
      ...req.body, 
    }
    pizzaData.push(newPizza)

    fs.writeFileSync(uploadPath, JSON.stringify(pizzaData, null, 2))
  
    res.status(201).json(newPizza)
  } catch (error) {
    console.error('Error writing to file:', error)
    res.status(500).send('Error writing to file')
  }
})

// ADMIN

const folderPath = './database/orders' 
const outputFilePath = './orders.json'
const refreshInterval = 1 * 60 * 1000

function mergeJSONFiles(folderPath: string, outputFile: string) {
  const mergedData: Record<string, any> = []

  // Read all files in the folder
  const fileNames = fs.readdirSync(folderPath)

  for (const fileName of fileNames) {
    const filePath = path.join(folderPath, fileName)

    // Check if the file is a JSON file
    if (path.extname(filePath) === '.json') {
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
        mergedData.push(data)
      } catch (error) {
        console.error(`Error reading or parsing ${fileName}: ${error}`)
      }
    }
  }
 
  fs.writeFileSync(outputFile, JSON.stringify(mergedData, null, 2))
  console.log(`Merged data saved to ${outputFile}`)
}

mergeJSONFiles(folderPath, outputFilePath)

setInterval(() => {
  mergeJSONFiles(folderPath, outputFilePath)
}, refreshInterval)

server.get('/api/admin', async (req:Request, res:Response) => {

  const orderData = fs.readFileSync('./orders.json', 'utf-8')
  const result = JSON.parse(orderData)
  return res.json(result)

})

// ADMIN

server.delete("/api/pizza/:id", async (req:Request, res:Response) => {
  const id = +req.params.id
  
  const content = JSON.parse(fs.readFileSync("./database/pizza.json", "utf-8"))
  const result = PizzaSchema.safeParse(content)
  
  if(!result.success){
    return res.sendStatus(500)
  }
  const pizzaData = result.data
  let filteredPizzas = pizzaData.filter( pizza => pizza.id !== id)
  
  fs.writeFileSync("./database/pizza.json", JSON.stringify(filteredPizzas, null, 2), "utf-8")
  
  if(filteredPizzas){
      return res.sendStatus(200)
  }else{
      res.sendStatus(404)
  }
})


server.listen(3333) 
