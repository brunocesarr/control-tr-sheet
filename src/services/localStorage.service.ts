import CryptoJS, { AES } from 'crypto-js'

const getItem = (
  key: string,
  validStorageTimeInSeconds: number = 2 * 60 * 60
) => {
  const item = localStorage.getItem(key)

  if (!item) return null

  const bytes = AES.decrypt(item, 'sw')
  const value = JSON.parse(bytes.toString(CryptoJS.enc.Utf8))

  const limitTimeValidStorage = new Date()
  limitTimeValidStorage.setSeconds(
    limitTimeValidStorage.getSeconds() + validStorageTimeInSeconds
  )
  const currentDateLocalStorage = new Date(value.date)

  if (currentDateLocalStorage.getTime() > limitTimeValidStorage.getTime())
    return null

  return value.value
}

const setItem = (key: string, value: any) => {
  const _value = { value, date: new Date().toDateString() }

  const valueCrypto = JSON.stringify(_value)
  const keyCrypto = 'sw'

  const encrypted = CryptoJS.AES.encrypt(valueCrypto, keyCrypto)

  localStorage.setItem(key, encrypted.toString())
}

const deleteItem = (key: string) => {
  localStorage.removeItem(key)
}

const localStorageService = {
  getItem,
  setItem,
  deleteItem,
}

export default localStorageService
