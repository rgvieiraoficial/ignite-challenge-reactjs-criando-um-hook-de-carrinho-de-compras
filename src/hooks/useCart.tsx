import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const responseStock = await api.get<Stock>(`/stock/${productId}`);

      const { amount } = responseStock.data;

      const productToAdd = cart.find((product) => product.id === productId);

      if (productToAdd?.amount === amount) {
        toast.error('Quantidade solicitada fora de estoque');
      } else {
        const responseProduct = await api.get(`/products/${productId}`);

        const { data } = responseProduct;

        const findProduct = cart.find((product) => product.id === productId);

        if (findProduct) {
          const index = cart.indexOf(findProduct);

          const cartArr = cart;

          const product = cartArr[index];

          cartArr.splice(index, 1);

          product.amount += 1;

          const atualizedCart = [
            ...cartArr,
            product
          ];

          setCart(atualizedCart);

          localStorage.setItem('@RocketShoes:cart', JSON.stringify(atualizedCart));
        } else {
          const product = {
            id: data.id,
            title: data.title,
            price: data.price,
            image: data.image,
            amount: 1
          }

          const atualizedCart = [
            ...cart,
            product
          ];

          setCart(atualizedCart);

          localStorage.setItem('@RocketShoes:cart', JSON.stringify(atualizedCart));
        }
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const findProduct = cart.find((product) => product.id === productId)

      if (findProduct) {
        const atualizedCart = cart.filter(function (product) {
          return product.id !== productId;
        });

        setCart(atualizedCart);

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(atualizedCart));
      } else {
        toast.error('Erro na remoção do produto');
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) return false;

      const responseStock = await api.get<Stock>(`/stock/${productId}`);

      const { amount: stock } = responseStock.data;

      if (amount > stock) {
        toast.error('Quantidade solicitada fora de estoque');
      } else {
        const findProduct = cart.find((product) => product.id === productId);

        if (findProduct) {
          const index = cart.indexOf(findProduct);

          const cartArr = cart;

          const product = cartArr[index];

          cartArr.splice(index, 1);

          product.amount = amount;

          const atualizedCart = [
            ...cartArr,
            product
          ];

          setCart(atualizedCart);

          localStorage.setItem('@RocketShoes:cart', JSON.stringify(atualizedCart));
        } else {
          toast.error('Erro na alteração de quantidade do produto');
        }
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
