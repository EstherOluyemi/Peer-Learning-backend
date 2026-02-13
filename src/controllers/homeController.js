export const getHome = (req, res) => {
  res.json({ message: 'Welcome to the Peer Learning Backend API' });
};

export const getHealth = (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString() 
  });
};
