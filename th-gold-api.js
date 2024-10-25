// Require package
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

    // Block useless information
    await page.setRequestInterception(true)

    const blockedResourceTypes = new Set([
      'image',
      'stylesheet',
      'font',
      'script',
      'media',
      'xhr',
      'fetch',
      'texttrack',
      'ping',
      'other',
      'preflight',
      'prefetch',
      'manifest',
      'signedexchange',
      'cspviolationreport',
    ])

    page.on('request', (request) => {
      const { resourceType } = request
      blockedResourceTypes.has(resourceType)
        ? request.abort()
        : request.continue()
    })

    await page.goto('https://xn--42cah7d0cxcvbbb9x.com/')

    // Extract gold price data and format it as JSON
    const data = await page.evaluate(() => {
      // Initialize an object to hold gold data
      const goldData = {
        title: '',
        prices: [],
        date: '', // New property to hold the date
      }

      // Select the main div that contains the gold shop information
      const goldShopDiv = document.querySelector('.divgta.goldshopf')

      // Check if the gold shop div exists
      if (goldShopDiv) {
        // Get the title of the gold shop from the h3 element
        goldData.title = goldShopDiv.querySelector('h3.h-h3').innerText

        // Select all the rows in the table body
        const rows = goldShopDiv.querySelectorAll('tbody tr.trline')

        // Map each row to an object containing item names and prices
        Array.from(rows).forEach((row) => {
          // Select all the cells in the current row
          const cells = row.querySelectorAll('td')

          // Check if the row contains the date information
          if (cells.length === 3 && cells[0].innerText.includes('ตุลาคม')) {
            // Extract date information
            goldData.date = cells[0].innerText // Assuming the first cell contains the date
          } else {
            // Check if the item is not the one to be excluded
            const itemName = cells[0]?.innerText
            if (itemName !== 'วันนี้ -50') {
              // Add item data to the prices array
              goldData.prices.push({
                item: itemName, // Name of the gold item
                buyPrice: cells[1]?.innerText, // Buy price of the item
                sellPrice: cells[2]?.innerText, // Sell price of the item
              })
            }
          }
        })
      } else {
        // If the gold shop data is not found, return an error message
        return { error: 'Gold shop data not found' }
      }

      // Return the gold data object with separated date
      return goldData
    })

    res.json(data) // Send data as JSON
  } catch (error) {
    res.status(500).send(error.message)
  } finally {
    await browser.close()
  }
})

app.listen(3000, () => {
  console.log('Server started at http://localhost:3000')
})
