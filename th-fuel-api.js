// Require packages
const express = require('express')
const puppeteer = require('puppeteer-core')

const app = express()

app.get('/', async (req, res) => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
  })

  try {
    const page = await browser.newPage()

    // Navigate to the gas price page
    await page.goto('http://gasprice.kapook.com/gasprice.php', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    })

    // Fetch fuel data for a specific company
    const fetchFuelData = async (company) => {
      return await page.evaluate((company) => {
        const items = Array.from(
          document.querySelectorAll(`article.gasprice.${company} ul li`)
        )
        const iconElement = document.querySelector(
          `article.gasprice.${company} img`
        )
        const iconUrl = iconElement ? iconElement.src : null

        const prices = items.map((item) => {
          const fuelType = item.querySelector('span')?.innerText
          const price = item.querySelector('em')?.innerText
          return { fuelType, price }
        })

        return { iconUrl, prices }
      }, company)
    }

    // List of oil companies
    const companies = [
      'ptt',
      'bcp',
      'shell',
      'esso',
      'caltex',
      'irpc',
      'pt',
      'susco',
      'pure',
      'suscodealers',
    ]

    // Fetch data for all companies concurrently
    const fuelDataPromises = companies.map((company) => fetchFuelData(company))
    const [
      PTT_DATA,
      BCP_DATA,
      SHELL_DATA,
      ESSO_DATA,
      CALTEX_DATA,
      IRPC_DATA,
      PT_DATA,
      SUSCO_DATA,
      PURE_DATA,
      SUSCODEALERS_DATA,
    ] = await Promise.all(fuelDataPromises)

    // Send the fetched data as JSON response
    return res.status(200).json({
      PTT_DATA,
      BCP_DATA,
      SHELL_DATA,
      ESSO_DATA,
      CALTEX_DATA,
      IRPC_DATA,
      PT_DATA,
      SUSCO_DATA,
      PURE_DATA,
      SUSCODEALERS_DATA,
    })
  } catch (error) {
    // Handle any errors
    console.error(error)
    return res.status(500).send('Internal Server Error')
  } finally {
    await browser.close() // Ensure the browser is closed
  }
})

// Start the server
app.listen(3000, () => {
  console.log('Server started at http://localhost:3000')
})
