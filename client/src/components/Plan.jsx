import React, { useEffect, useState } from 'react'
import {PricingTable} from '@clerk/clerk-react'
import axios from 'axios'

// Currency mapping for common countries
const countryToCurrency = {
  'IN': 'INR', // India
  'US': 'USD', // United States
  'GB': 'GBP', // United Kingdom
  'CA': 'CAD', // Canada
  'AU': 'AUD', // Australia
  'EU': 'EUR', // European Union
  'JP': 'JPY', // Japan
  'CN': 'CNY', // China
  'BR': 'BRL', // Brazil
  'MX': 'MXN', // Mexico
  'KR': 'KRW', // South Korea
  'SG': 'SGD', // Singapore
  'AE': 'AED', // UAE
  'SA': 'SAR', // Saudi Arabia
  'ZA': 'ZAR', // South Africa
  'NZ': 'NZD', // New Zealand
  'CH': 'CHF', // Switzerland
  'NO': 'NOK', // Norway
  'SE': 'SEK', // Sweden
  'DK': 'DKK', // Denmark
}

// Get country from timezone
const getCountryFromTimezone = () => {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    // Map common timezones to countries
    const timezoneToCountry = {
      'Asia/Kolkata': 'IN',
      'Asia/Calcutta': 'IN',
      'America/New_York': 'US',
      'America/Los_Angeles': 'US',
      'America/Chicago': 'US',
      'Europe/London': 'GB',
      'America/Toronto': 'CA',
      'Australia/Sydney': 'AU',
      'Europe/Berlin': 'EU',
      'Europe/Paris': 'EU',
      'Asia/Tokyo': 'JP',
      'Asia/Shanghai': 'CN',
      'America/Sao_Paulo': 'BR',
      'America/Mexico_City': 'MX',
      'Asia/Seoul': 'KR',
      'Asia/Singapore': 'SG',
      'Asia/Dubai': 'AE',
      'Asia/Riyadh': 'SA',
      'Africa/Johannesburg': 'ZA',
      'Pacific/Auckland': 'NZ',
      'Europe/Zurich': 'CH',
      'Europe/Oslo': 'NO',
      'Europe/Stockholm': 'SE',
      'Europe/Copenhagen': 'DK',
    }
    return timezoneToCountry[timezone] || null
  } catch (error) {
    return null
  }
}

const Plan = () => {
  const [currency, setCurrency] = useState('USD')
  const [exchangeRate, setExchangeRate] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const detectCurrency = async () => {
      try {
        let countryCode = 'US'
        
        // Try to get country from timezone first (more accurate)
        const timezoneCountry = getCountryFromTimezone()
        if (timezoneCountry) {
          countryCode = timezoneCountry
        } else {
          // Fallback to browser locale
          const locale = navigator.language || navigator.userLanguage
          countryCode = locale.split('-')[1]?.toUpperCase() || 'US'
        }
        
        // Get currency for the country
        const detectedCurrency = countryToCurrency[countryCode] || 'USD'
        
        // If not USD, get exchange rate
        if (detectedCurrency !== 'USD') {
          try {
            // Using a free currency API (exchangerate-api.com)
            const response = await axios.get(
              `https://api.exchangerate-api.com/v4/latest/USD`,
              { timeout: 5000 }
            )
            const rate = response.data.rates[detectedCurrency]
            if (rate) {
              setExchangeRate(rate)
              setCurrency(detectedCurrency)
            }
          } catch (error) {
            console.error('Error fetching exchange rate:', error)
            // Fallback to USD if API fails
            setCurrency('USD')
            setExchangeRate(1)
          }
        } else {
          setCurrency('USD')
          setExchangeRate(1)
        }
      } catch (error) {
        console.error('Error detecting currency:', error)
        setCurrency('USD')
        setExchangeRate(1)
      } finally {
        setLoading(false)
      }
    }

    detectCurrency()
  }, [])

  // Inject converted prices into Clerk's PricingTable
  useEffect(() => {
    if (!loading && currency !== 'USD') {
      const formatPrice = (usdPrice) => {
        const convertedPrice = usdPrice * exchangeRate
        return new Intl.NumberFormat(navigator.language, {
          style: 'currency',
          currency: currency,
          minimumFractionDigits: currency === 'JPY' || currency === 'KRW' ? 0 : 2,
          maximumFractionDigits: currency === 'JPY' || currency === 'KRW' ? 0 : 2,
        }).format(convertedPrice)
      }

      const replacePrices = () => {
        // Find all elements that might contain the price
        const allElements = document.querySelectorAll('*')
        
        allElements.forEach((element) => {
          // Skip if already converted or if element has children (we want leaf nodes)
          if (element.dataset?.priceConverted || element.children.length > 0) return
          
          const text = element.textContent || ''
          
          // Look for "$16" pattern (specifically $16, not other amounts)
          if (text.includes('$16') && !text.includes(currency) && !element.dataset?.priceConverted) {
            const usdPrice = 16
            const convertedPrice = formatPrice(usdPrice)
            
            // Replace $16 with converted price, preserving surrounding text
            if (text.includes('/month')) {
              element.textContent = text.replace(/\$16/g, convertedPrice)
            } else if (text.trim() === '$16' || text.trim().startsWith('$16')) {
              element.textContent = text.replace(/\$16/g, convertedPrice)
            } else {
              // For elements with mixed content, try to replace just the $16 part
              element.innerHTML = element.innerHTML.replace(/\$16/g, convertedPrice)
            }
            
            element.dataset.priceConverted = 'true'
          }
        })

        // Also check text nodes directly
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          null
        )

        let textNode
        while (textNode = walker.nextNode()) {
          if (textNode.parentElement?.dataset?.priceConverted) continue
          
          const text = textNode.textContent || ''
          
          // Replace $16 in text nodes
          if (text.includes('$16') && !text.includes(currency)) {
            const convertedPrice = formatPrice(16)
            const newText = text.replace(/\$16/g, convertedPrice)
            if (newText !== text) {
              textNode.textContent = newText
              if (textNode.parentElement) {
                textNode.parentElement.dataset.priceConverted = 'true'
              }
            }
          }
        }
      }

      // Use MutationObserver to watch for DOM changes
      const observer = new MutationObserver(() => {
        replacePrices()
      })

      // Start observing the entire document
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
      })

      // Initial replacement attempts with delays to catch async rendering
      setTimeout(replacePrices, 500)
      setTimeout(replacePrices, 1000)
      setTimeout(replacePrices, 2000)
      setTimeout(replacePrices, 3000)
      setTimeout(replacePrices, 5000)

      return () => {
        observer.disconnect()
      }
    }
  }, [loading, currency, exchangeRate])

  return (
    <div className='max-2-2xl mx-auto z-20 my-30'>
        <div className='text-center'>
            <h2 className='text-state-700 text-[42px] font-semibold'>Choose Your Plan</h2>
            <p className='text-gray-500 max-w-lg mx-auto'>Start for free and scale up as you grow. Find the perfect plan for your content creation needs.</p>
            {!loading && currency !== 'USD' && (
              <p className='text-sm text-blue-600 mt-2 font-medium'>
                💰 Prices displayed in {currency} (1 USD ≈ {exchangeRate.toFixed(2)} {currency})
              </p>
            )}
        </div>

        <div className='mt-14 max-sm:mx-8'>
            <PricingTable />
        </div>

    </div>
  )
}

export default Plan
