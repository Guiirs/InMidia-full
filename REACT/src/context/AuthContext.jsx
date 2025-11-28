// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

// Função para decodificar JWT sem biblioteca externa
const decodeJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Erro ao decodificar token:', error);
    return null;
  }
};

// 1. Criar o Contexto
const AuthContext = createContext(null);

// 2. Criar o Componente Provider
export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [token, setTokenState] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Para verificar o estado inicial
  const [sessionWarning, setSessionWarning] = useState(false); // Aviso de sessão prestes a expirar

  // 3. Efeito para carregar do localStorage ao iniciar
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedUserString = localStorage.getItem('user');

      if (storedToken && storedUserString) {
        const storedUser = JSON.parse(storedUserString);
        setUserState(storedUser);
        setTokenState(storedToken);
        setIsAuthenticated(true);
        console.log('[AuthContext] Sessão restaurada do localStorage.');
      } else {
         console.log('[AuthContext] Nenhuma sessão encontrada no localStorage.');
      }
    } catch (error) {
       console.error('[AuthContext] Erro ao carregar dados do localStorage:', error);
       // Limpa o storage em caso de erro ao parsear
       localStorage.removeItem('token');
       localStorage.removeItem('user');
    } finally {
        setIsLoading(false); // Marca que a verificação inicial terminou
    }
  }, []); // Executa apenas uma vez ao montar

  // Efeito para verificar expiração do token periodicamente
  useEffect(() => {
    if (!token) return;

    const checkTokenExpiration = () => {
      const decoded = decodeJWT(token);
      if (decoded && decoded.exp) {
        const currentTime = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = decoded.exp - currentTime;

        if (timeUntilExpiry <= 0) {
          // Token já expirou
          console.log('[AuthContext] Token expirado, fazendo logout.');
          logout();
        } else if (timeUntilExpiry <= 300) { // 5 minutos antes
          // Avisar que vai expirar em breve
          console.log('[AuthContext] Token expira em breve.');
          setSessionWarning(true);
        } else {
          setSessionWarning(false);
        }
      }
    };

    // Verificar imediatamente
    checkTokenExpiration();

    // Verificar a cada minuto
    const interval = setInterval(checkTokenExpiration, 60000);

    return () => clearInterval(interval);
  }, [token]);

  // 4. Função de Login
  const login = (userData, userToken) => {
    try {
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', userToken);
        setUserState(userData);
        setTokenState(userToken);
        setIsAuthenticated(true);
        console.log('[AuthContext] Utilizador logado:', userData.username);
    } catch (error) {
        console.error('[AuthContext] Erro ao guardar dados no localStorage durante o login:', error);
        // Poderia mostrar um erro ao utilizador aqui
    }
  };

  // 5. Função de Logout
  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUserState(null);
    setTokenState(null);
    setIsAuthenticated(false);
    console.log('[AuthContext] Utilizador deslogado.');
    // O redirecionamento será tratado pelo componente que chama logout
  };

    // Função para atualizar apenas os dados do utilizador (ex: após editar perfil)
    const updateUser = (newUserData) => {
        if (isAuthenticated && newUserData) {
            try {
                localStorage.setItem('user', JSON.stringify(newUserData));
                setUserState(newUserData);
                console.log('[AuthContext] Dados do utilizador atualizados:', newUserData.username);
            } catch (error) {
                console.error('[AuthContext] Erro ao atualizar dados do utilizador no localStorage:', error);
            }
        }
    };

  // 6. Valor fornecido pelo Contexto
  const value = {
    user,
    token,
    isAuthenticated,
    isLoading, // Expõe o estado de carregamento inicial
    sessionWarning, // Aviso de sessão prestes a expirar
    login,
    logout,
    updateUser // Expõe a função para atualizar user data
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// 7. Hook customizado para usar o contexto facilmente
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}