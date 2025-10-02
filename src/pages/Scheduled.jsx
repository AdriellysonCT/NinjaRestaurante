import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as Icons from '../components/icons/index.jsx';
const { CalendarIcon, ClockIcon, PhoneIcon, UsersIcon, EditIcon, XIcon, MessageSquareIcon } = Icons;
import { Modal } from '../components/ui/Modal';
import { useAppContext } from '../context/AppContext';

export const Scheduled = () => {
  const { isOnline } = useAppContext();
  const [reservations, setReservations] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('day'); // 'day', 'week', 'month'
  const [timeSlots, setTimeSlots] = useState([]);
  const [capacity, setCapacity] = useState({});
  const [newReservation, setNewReservation] = useState({
    name: '',
    phone: '',
    email: '',
    date: new Date().toISOString().split('T')[0],
    time: '19:00',
    people: 2,
    table: '',
    notes: '',
    status: 'confirmed'
  });
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [messageText, setMessageText] = useState('');

  // Inicializar reservas (simulação)
  useEffect(() => {
    // Em um ambiente real, isso viria do backend
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const initialReservations = [
      {
        id: 1,
        name: 'João Silva',
        phone: '(11) 98765-4321',
        email: 'joao@email.com',
        date: today.toISOString().split('T')[0],
        time: '19:00',
        people: 4,
        table: '5',
        notes: 'Aniversário de casamento',
        status: 'confirmed',
        createdAt: new Date(today.getTime() - 86400000).toISOString()
      },
      {
        id: 2,
        name: 'Maria Oliveira',
        phone: '(11) 91234-5678',
        email: 'maria@email.com',
        date: today.toISOString().split('T')[0],
        time: '20:30',
        people: 2,
        table: '3',
        notes: 'Prefere mesa perto da janela',
        status: 'confirmed',
        createdAt: new Date(today.getTime() - 172800000).toISOString()
      },
      {
        id: 3,
        name: 'Carlos Mendes',
        phone: '(11) 99876-5432',
        email: 'carlos@email.com',
        date: tomorrow.toISOString().split('T')[0],
        time: '12:30',
        people: 6,
        table: '8',
        notes: 'Grupo de trabalho',
        status: 'pending',
        createdAt: new Date(today.getTime() - 43200000).toISOString()
      }
    ];
    
    setReservations(initialReservations);
    
    // Inicializar capacidade por horário (simulação)
    const initialCapacity = {};
    for (let hour = 11; hour <= 22; hour++) {
      initialCapacity[`${hour}:00`] = 20;
      initialCapacity[`${hour}:30`] = 20;
    }
    
    setCapacity(initialCapacity);
  }, []);

  // Gerar slots de horário com base na data selecionada
  useEffect(() => {
    const slots = [];
    
    // Horários de funcionamento (11:00 às 22:00)
    for (let hour = 11; hour <= 22; hour++) {
      slots.push(`${hour}:00`);
      slots.push(`${hour}:30`);
    }
    
    setTimeSlots(slots);
  }, [currentDate]);

  // Formatar data para exibição
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
  };

  // Formatar data curta
  const formatShortDate = (dateString) => {
    const options = { day: '2-digit', month: '2-digit' };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
  };

  // Obter reservas do dia atual
  const getTodayReservations = () => {
    const dateString = currentDate.toISOString().split('T')[0];
    return reservations.filter(r => r.date === dateString);
  };

  // Obter cor de status
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-success/20 text-success';
      case 'pending': return 'bg-yellow-500/20 text-yellow-500';
      case 'cancelled': return 'bg-destructive/20 text-destructive';
      case 'completed': return 'bg-blue-500/20 text-blue-500';
      default: return 'bg-secondary/20 text-secondary-foreground';
    }
  };

  // Obter texto de status
  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed': return 'Confirmada';
      case 'pending': return 'Pendente';
      case 'cancelled': return 'Cancelada';
      case 'completed': return 'Concluída';
      default: return status;
    }
  };

  // Adicionar nova reserva
  const addReservation = () => {
    // Validar campos obrigatórios
    if (!newReservation.name || !newReservation.phone || !newReservation.date || !newReservation.time) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    
    const newId = Math.max(...reservations.map(r => r.id), 0) + 1;
    
    const reservation = {
      ...newReservation,
      id: newId,
      createdAt: new Date().toISOString()
    };
    
    setReservations([...reservations, reservation]);
    setIsAddModalOpen(false);
    
    // Limpar formulário
    setNewReservation({
      name: '',
      phone: '',
      email: '',
      date: new Date().toISOString().split('T')[0],
      time: '19:00',
      people: 2,
      table: '',
      notes: '',
      status: 'confirmed'
    });
    
    // Mostrar opção de enviar confirmação
    if (isOnline) {
      if (window.confirm('Deseja enviar uma confirmação para o cliente?')) {
        setSelectedReservation(reservation);
        setIsMessageModalOpen(true);
        setMessageText(`Olá ${reservation.name}, sua reserva para ${reservation.people} pessoas no dia ${formatDate(reservation.date)} às ${reservation.time} foi confirmada. Agradecemos a preferência!`);
      }
    }
  };

  // Atualizar status da reserva
  const updateReservationStatus = (id, status) => {
    setReservations(reservations.map(r => {
      if (r.id === id) {
        return { ...r, status };
      }
      return r;
    }));
    
    setIsReservationModalOpen(false);
  };

  // Enviar mensagem de confirmação
  const sendConfirmationMessage = () => {
    if (!selectedReservation) return;
    
    // Em um ambiente real, isso enviaria uma mensagem SMS ou WhatsApp
    console.log(`Enviando mensagem para ${selectedReservation.name} (${selectedReservation.phone}):`, messageText);
    
    alert(`Mensagem enviada para ${selectedReservation.phone}`);
    setIsMessageModalOpen(false);
  };

  // Renderizar visualização diária otimizada
  const renderDayView = () => {
    const todayReservations = getTodayReservations();
    
    // Agrupar horários por período
    const periods = {
      morning: timeSlots.filter(time => {
        const hour = parseInt(time.split(':')[0]);
        return hour >= 6 && hour < 12;
      }),
      afternoon: timeSlots.filter(time => {
        const hour = parseInt(time.split(':')[0]);
        return hour >= 12 && hour < 18;
      }),
      evening: timeSlots.filter(time => {
        const hour = parseInt(time.split(':')[0]);
        return hour >= 18 && hour < 24;
      })
    };
    
    // Função para obter cor de ocupação
    const getOccupancyColor = (percentage) => {
      if (percentage >= 80) return 'bg-destructive/20';
      if (percentage >= 50) return 'bg-yellow-500/20';
      return 'bg-success/20';
    };
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold">{formatDate(currentDate)}</h3>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                const newDate = new Date(currentDate);
                newDate.setDate(newDate.getDate() - 1);
                setCurrentDate(newDate);
              }}
              className="p-1 rounded-md bg-secondary text-secondary-foreground"
            >
              &lt;
            </button>
            <button 
              onClick={() => setCurrentDate(new Date())}
              className="px-2 py-1 rounded-md bg-primary text-primary-foreground text-xs"
            >
              Hoje
            </button>
            <button 
              onClick={() => {
                const newDate = new Date(currentDate);
                newDate.setDate(newDate.getDate() + 1);
                setCurrentDate(newDate);
              }}
              className="p-1 rounded-md bg-secondary text-secondary-foreground"
            >
              &gt;
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Período da manhã */}
          <div className="ninja-card p-4 space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
              Manhã (6h - 12h)
            </h4>
            
            <div className="grid grid-cols-4 gap-1">
              {periods.morning.map(time => {
                const reservationsAtTime = todayReservations.filter(r => r.time === time);
                const totalPeople = reservationsAtTime.reduce((sum, r) => sum + r.people, 0);
                const maxCapacity = capacity[time] || 20;
                const occupancyPercentage = Math.min(100, Math.round((totalPeople / maxCapacity) * 100));
                
                return (
                  <div 
                    key={time}
                    onClick={() => {
                      if (reservationsAtTime.length > 0) {
                        // Mostrar modal com todas as reservas deste horário
                        setSelectedReservation(reservationsAtTime[0]);
                        setIsReservationModalOpen(true);
                      }
                    }}
                    className={`p-2 rounded-md ${getOccupancyColor(occupancyPercentage)} ${
                      reservationsAtTime.length > 0 ? 'cursor-pointer hover:opacity-80' : ''
                    }`}
                  >
                    <div className="text-center">
                      <p className="text-xs font-medium">{time}</p>
                      {reservationsAtTime.length > 0 ? (
                        <div className="mt-1">
                          <p className="text-xs font-bold">{reservationsAtTime.length}</p>
                          <p className="text-[10px] text-muted-foreground">{totalPeople} pessoas</p>
                        </div>
                      ) : (
                        <p className="text-[10px] mt-1 text-muted-foreground">Livre</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Período da tarde */}
          <div className="ninja-card p-4 space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              Tarde (12h - 18h)
            </h4>
            
            <div className="grid grid-cols-4 gap-1">
              {periods.afternoon.map(time => {
                const reservationsAtTime = todayReservations.filter(r => r.time === time);
                const totalPeople = reservationsAtTime.reduce((sum, r) => sum + r.people, 0);
                const maxCapacity = capacity[time] || 20;
                const occupancyPercentage = Math.min(100, Math.round((totalPeople / maxCapacity) * 100));
                
                return (
                  <div 
                    key={time}
                    onClick={() => {
                      if (reservationsAtTime.length > 0) {
                        setSelectedReservation(reservationsAtTime[0]);
                        setIsReservationModalOpen(true);
                      }
                    }}
                    className={`p-2 rounded-md ${getOccupancyColor(occupancyPercentage)} ${
                      reservationsAtTime.length > 0 ? 'cursor-pointer hover:opacity-80' : ''
                    }`}
                  >
                    <div className="text-center">
                      <p className="text-xs font-medium">{time}</p>
                      {reservationsAtTime.length > 0 ? (
                        <div className="mt-1">
                          <p className="text-xs font-bold">{reservationsAtTime.length}</p>
                          <p className="text-[10px] text-muted-foreground">{totalPeople} pessoas</p>
                        </div>
                      ) : (
                        <p className="text-[10px] mt-1 text-muted-foreground">Livre</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Período da noite */}
          <div className="ninja-card p-4 space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Noite (18h - 24h)
            </h4>
            
            <div className="grid grid-cols-4 gap-1">
              {periods.evening.map(time => {
                const reservationsAtTime = todayReservations.filter(r => r.time === time);
                const totalPeople = reservationsAtTime.reduce((sum, r) => sum + r.people, 0);
                const maxCapacity = capacity[time] || 20;
                const occupancyPercentage = Math.min(100, Math.round((totalPeople / maxCapacity) * 100));
                
                return (
                  <div 
                    key={time}
                    onClick={() => {
                      if (reservationsAtTime.length > 0) {
                        setSelectedReservation(reservationsAtTime[0]);
                        setIsReservationModalOpen(true);
                      }
                    }}
                    className={`p-2 rounded-md ${getOccupancyColor(occupancyPercentage)} ${
                      reservationsAtTime.length > 0 ? 'cursor-pointer hover:opacity-80' : ''
                    }`}
                  >
                    <div className="text-center">
                      <p className="text-xs font-medium">{time}</p>
                      {reservationsAtTime.length > 0 ? (
                        <div className="mt-1">
                          <p className="text-xs font-bold">{reservationsAtTime.length}</p>
                          <p className="text-[10px] text-muted-foreground">{totalPeople} pessoas</p>
                        </div>
                      ) : (
                        <p className="text-[10px] mt-1 text-muted-foreground">Livre</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Lista de reservas do dia */}
        <div className="ninja-card p-4">
          <h4 className="font-medium mb-3">Reservas de {formatDate(currentDate)}</h4>
          
          {todayReservations.length > 0 ? (
            <div className="space-y-2">
              {todayReservations
                .sort((a, b) => {
                  // Ordenar por horário
                  const timeA = a.time.split(':').map(Number);
                  const timeB = b.time.split(':').map(Number);
                  
                  if (timeA[0] !== timeB[0]) return timeA[0] - timeB[0];
                  return timeA[1] - timeB[1];
                })
                .map(reservation => (
                  <div 
                    key={reservation.id}
                    onClick={() => {
                      setSelectedReservation(reservation);
                      setIsReservationModalOpen(true);
                    }}
                    className="flex items-center gap-3 p-2 border-b border-border last:border-0 cursor-pointer hover:bg-secondary/10 rounded-md"
                  >
                    <div className="flex-shrink-0 w-12 text-center">
                      <p className="text-sm font-bold">{reservation.time}</p>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{reservation.name}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <UsersIcon className="w-3 h-3" />
                        <span>{reservation.people} pessoas</span>
                        {reservation.table && <span>· Mesa {reservation.table}</span>}
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs ${getStatusColor(reservation.status)}`}>
                      {getStatusText(reservation.status)}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma reserva para esta data
            </div>
          )}
        </div>
      </div>
    );
  };

  // Renderizar visualização semanal
  const renderWeekView = () => {
    // Obter o primeiro dia da semana (domingo)
    const firstDay = new Date(currentDate);
    const day = currentDate.getDay();
    firstDay.setDate(firstDay.getDate() - day);
    
    // Gerar array com os 7 dias da semana
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(firstDay);
      date.setDate(date.getDate() + i);
      return date;
    });
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold">
            Semana de {formatShortDate(weekDays[0])} a {formatShortDate(weekDays[6])}
          </h3>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                const newDate = new Date(currentDate);
                newDate.setDate(newDate.getDate() - 7);
                setCurrentDate(newDate);
              }}
              className="p-1 rounded-md bg-secondary text-secondary-foreground"
            >
              &lt;
            </button>
            <button 
              onClick={() => setCurrentDate(new Date())}
              className="px-2 py-1 rounded-md bg-primary text-primary-foreground text-xs"
            >
              Hoje
            </button>
            <button 
              onClick={() => {
                const newDate = new Date(currentDate);
                newDate.setDate(newDate.getDate() + 7);
                setCurrentDate(newDate);
              }}
              className="p-1 rounded-md bg-secondary text-secondary-foreground"
            >
              &gt;
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((date, index) => {
            const dateString = date.toISOString().split('T')[0];
            const dayReservations = reservations.filter(r => r.date === dateString);
            const isToday = new Date().toISOString().split('T')[0] === dateString;
            
            return (
              <div 
                key={index} 
                className={`ninja-card p-2 ${isToday ? 'border-primary' : ''}`}
                onClick={() => {
                  setCurrentDate(date);
                  setViewMode('day');
                }}
              >
                <div className="text-center mb-2">
                  <p className="text-xs text-muted-foreground">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][date.getDay()]}
                  </p>
                  <p className={`font-bold ${isToday ? 'text-primary' : ''}`}>
                    {date.getDate()}
                  </p>
                </div>
                
                <div className="text-center">
                  <p className="text-xs font-medium">{dayReservations.length} reservas</p>
                  <p className="text-xs text-muted-foreground">
                    {dayReservations.reduce((sum, r) => sum + r.people, 0)} pessoas
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="ninja-card p-4">
          <h4 className="font-medium mb-2">Próximas Reservas</h4>
          
          {reservations
            .filter(r => new Date(r.date) >= new Date().setHours(0, 0, 0, 0))
            .sort((a, b) => {
              const dateA = new Date(`${a.date}T${a.time}`);
              const dateB = new Date(`${b.date}T${b.time}`);
              return dateA - dateB;
            })
            .slice(0, 5)
            .map(reservation => (
              <div 
                key={reservation.id}
                onClick={() => {
                  setSelectedReservation(reservation);
                  setIsReservationModalOpen(true);
                }}
                className="border-b border-border py-2 last:border-0 cursor-pointer hover:bg-secondary/10"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{reservation.name}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CalendarIcon className="w-3 h-3" />
                      <span>{formatShortDate(reservation.date)} {reservation.time}</span>
                      <span>·</span>
                      <UsersIcon className="w-3 h-3" />
                      <span>{reservation.people} pessoas</span>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs ${getStatusColor(reservation.status)}`}>
                    {getStatusText(reservation.status)}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  };

  // Renderizar visualização mensal
  const renderMonthView = () => {
    // Obter o primeiro dia do mês
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    // Obter o dia da semana do primeiro dia (0 = Domingo, 6 = Sábado)
    const firstDayOfWeek = firstDay.getDay();
    
    // Calcular o número de dias a serem exibidos (incluindo dias do mês anterior e próximo)
    const daysInMonth = lastDay.getDate();
    const totalDays = Math.ceil((daysInMonth + firstDayOfWeek) / 7) * 7;
    
    // Gerar array com todos os dias a serem exibidos
    const days = [];
    
    // Dias do mês anterior
    for (let i = 0; i < firstDayOfWeek; i++) {
      const date = new Date(firstDay);
      date.setDate(date.getDate() - (firstDayOfWeek - i));
      days.push({ date, isCurrentMonth: false });
    }
    
    // Dias do mês atual
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
      days.push({ date, isCurrentMonth: true });
    }
    
    // Dias do próximo mês
    const remainingDays = totalDays - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i);
      days.push({ date, isCurrentMonth: false });
    }
    
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                const newDate = new Date(currentDate);
                newDate.setMonth(newDate.getMonth() - 1);
                setCurrentDate(newDate);
              }}
              className="p-1 rounded-md bg-secondary text-secondary-foreground"
            >
              &lt;
            </button>
            <button 
              onClick={() => setCurrentDate(new Date())}
              className="px-2 py-1 rounded-md bg-primary text-primary-foreground text-xs"
            >
              Hoje
            </button>
            <button 
              onClick={() => {
                const newDate = new Date(currentDate);
                newDate.setMonth(newDate.getMonth() + 1);
                setCurrentDate(newDate);
              }}
              className="p-1 rounded-md bg-secondary text-secondary-foreground"
            >
              &gt;
            </button>
          </div>
        </div>
        
        <div className="ninja-card p-2">
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, index) => (
              <div key={index} className="text-center text-xs font-medium py-1">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              const dateString = day.date.toISOString().split('T')[0];
              const dayReservations = reservations.filter(r => r.date === dateString);
              const isToday = new Date().toISOString().split('T')[0] === dateString;
              
              return (
                <div 
                  key={index} 
                  onClick={() => {
                    setCurrentDate(day.date);
                    setViewMode('day');
                  }}
                  className={`p-1 min-h-[60px] border rounded-md cursor-pointer ${
                    isToday 
                      ? 'border-primary' 
                      : day.isCurrentMonth 
                        ? 'border-border' 
                        : 'border-transparent bg-secondary/20'
                  }`}
                >
                  <div className={`text-xs font-medium ${
                    day.isCurrentMonth ? '' : 'text-muted-foreground'
                  } ${isToday ? 'text-primary' : ''}`}>
                    {day.date.getDate()}
                  </div>
                  
                  {dayReservations.length > 0 && (
                    <div className="mt-1">
                      {dayReservations.length <= 2 ? (
                        dayReservations.map(r => (
                          <div 
                            key={r.id} 
                            className={`text-xs truncate px-1 py-0.5 rounded-sm mb-0.5 ${getStatusColor(r.status)}`}
                          >
                            {r.time} - {r.name}
                          </div>
                        ))
                      ) : (
                        <div className="text-xs font-medium text-center bg-primary/20 text-primary rounded-sm px-1 py-0.5">
                          {dayReservations.length} reservas
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-2 sm:p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold">Reservas</h2>
        <div className="flex gap-2">
          <div className="flex border border-border rounded-md overflow-hidden">
            <button 
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 text-xs ${viewMode === 'day' ? 'bg-primary text-primary-foreground' : 'bg-card'}`}
            >
              Dia
            </button>
            <button 
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 text-xs ${viewMode === 'week' ? 'bg-primary text-primary-foreground' : 'bg-card'}`}
            >
              Semana
            </button>
            <button 
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 text-xs ${viewMode === 'month' ? 'bg-primary text-primary-foreground' : 'bg-card'}`}
            >
              Mês
            </button>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-primary text-primary-foreground px-3 py-1 rounded-md text-sm font-semibold hover:bg-primary/90"
          >
            Nova Reserva
          </button>
        </div>
      </div>
      
      {/* Visualizações */}
      {viewMode === 'day' && renderDayView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'month' && renderMonthView()}
      
      {/* Modal de detalhes da reserva */}
      <Modal 
        isOpen={isReservationModalOpen} 
        onClose={() => setIsReservationModalOpen(false)} 
        title="Detalhes da Reserva"
      >
        {selectedReservation && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold">{selectedReservation.name}</h3>
              <div className={`px-2 py-1 rounded-full text-xs ${getStatusColor(selectedReservation.status)}`}>
                {getStatusText(selectedReservation.status)}
              </div>
            </div>
            
            <div className="ninja-card p-3 space-y-3">
              <div className="flex items-start gap-3">
                <CalendarIcon className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Data e Hora</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(selectedReservation.date)} às {selectedReservation.time}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <UsersIcon className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Pessoas</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedReservation.people} pessoas
                    {selectedReservation.table && ` · Mesa ${selectedReservation.table}`}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <PhoneIcon className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Contato</p>
                  <p className="text-sm text-muted-foreground">{selectedReservation.phone}</p>
                  {selectedReservation.email && (
                    <p className="text-sm text-muted-foreground">{selectedReservation.email}</p>
                  )}
                </div>
              </div>
              
              {selectedReservation.notes && (
                <div className="flex items-start gap-3">
                  <MessageSquareIcon className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Observações</p>
                    <p className="text-sm text-muted-foreground">{selectedReservation.notes}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="text-xs text-muted-foreground">
              Reserva criada em {new Date(selectedReservation.createdAt).toLocaleString()}
            </div>
            
            {/* Ações */}
            <div className="grid grid-cols-2 gap-2 pt-4">
              {selectedReservation.status === 'pending' && (
                <>
                  <button 
                    onClick={() => updateReservationStatus(selectedReservation.id, 'confirmed')}
                    className="py-2 text-sm font-semibold rounded-md bg-success text-success-foreground hover:bg-success/90"
                  >
                    Confirmar
                  </button>
                  <button 
                    onClick={() => updateReservationStatus(selectedReservation.id, 'cancelled')}
                    className="py-2 text-sm font-semibold rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Cancelar
                  </button>
                </>
              )}
              
              {selectedReservation.status === 'confirmed' && (
                <>
                  <button 
                    onClick={() => {
                      setMessageText(`Olá ${selectedReservation.name}, confirmando sua reserva para ${selectedReservation.people} pessoas amanhã às ${selectedReservation.time}. Aguardamos sua visita!`);
                      setIsMessageModalOpen(true);
                    }}
                    className="py-2 text-sm font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Enviar Lembrete
                  </button>
                  <button 
                    onClick={() => updateReservationStatus(selectedReservation.id, 'cancelled')}
                    className="py-2 text-sm font-semibold rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Cancelar
                  </button>
                </>
              )}
              
              {selectedReservation.status === 'cancelled' && (
                <button 
                  onClick={() => updateReservationStatus(selectedReservation.id, 'confirmed')}
                  className="col-span-2 py-2 text-sm font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Reativar Reserva
                </button>
              )}
              
              {selectedReservation.status === 'completed' && (
                <button 
                  onClick={() => setIsReservationModalOpen(false)}
                  className="col-span-2 py-2 text-sm font-semibold rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80"
                >
                  Fechar
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
      
      {/* Modal para adicionar reserva */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title="Nova Reserva"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome*</label>
              <input 
                type="text" 
                className="w-full bg-input px-3 py-2 rounded-md text-sm"
                value={newReservation.name}
                onChange={(e) => setNewReservation({...newReservation, name: e.target.value})}
                placeholder="Nome do cliente"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Telefone*</label>
              <input 
                type="text" 
                className="w-full bg-input px-3 py-2 rounded-md text-sm"
                value={newReservation.phone}
                onChange={(e) => setNewReservation({...newReservation, phone: e.target.value})}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input 
              type="email" 
              className="w-full bg-input px-3 py-2 rounded-md text-sm"
              value={newReservation.email}
              onChange={(e) => setNewReservation({...newReservation, email: e.target.value})}
              placeholder="email@exemplo.com"
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Data*</label>
              <input 
                type="date" 
                className="w-full bg-input px-3 py-2 rounded-md text-sm"
                value={newReservation.date}
                onChange={(e) => setNewReservation({...newReservation, date: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Hora*</label>
              <select 
                className="w-full bg-input px-3 py-2 rounded-md text-sm"
                value={newReservation.time}
                onChange={(e) => setNewReservation({...newReservation, time: e.target.value})}
              >
                {timeSlots.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Número de Pessoas*</label>
              <input 
                type="number" 
                min="1"
                max="20"
                className="w-full bg-input px-3 py-2 rounded-md text-sm"
                value={newReservation.people}
                onChange={(e) => setNewReservation({...newReservation, people: parseInt(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mesa (opcional)</label>
              <input 
                type="text" 
                className="w-full bg-input px-3 py-2 rounded-md text-sm"
                value={newReservation.table}
                onChange={(e) => setNewReservation({...newReservation, table: e.target.value})}
                placeholder="Número da mesa"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Observações</label>
            <textarea 
              className="w-full bg-input px-3 py-2 rounded-md text-sm min-h-[80px]"
              value={newReservation.notes}
              onChange={(e) => setNewReservation({...newReservation, notes: e.target.value})}
              placeholder="Observações especiais, preferências, etc."
            />
          </div>
          
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="send-confirmation" 
              checked={newReservation.status === 'confirmed'}
              onChange={(e) => setNewReservation({
                ...newReservation, 
                status: e.target.checked ? 'confirmed' : 'pending'
              })}
            />
            <label htmlFor="send-confirmation" className="text-sm">Confirmar automaticamente</label>
          </div>
          
          <div className="flex gap-2 pt-4">
            <button 
              onClick={() => setIsAddModalOpen(false)}
              className="flex-1 py-2 text-sm font-semibold rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
              Cancelar
            </button>
            <button 
              onClick={addReservation}
              className="flex-1 py-2 text-sm font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Salvar Reserva
            </button>
          </div>
        </div>
      </Modal>
      
      {/* Modal para enviar mensagem */}
      <Modal 
        isOpen={isMessageModalOpen} 
        onClose={() => setIsMessageModalOpen(false)} 
        title="Enviar Mensagem"
      >
        {selectedReservation && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Para</label>
              <div className="bg-secondary/20 px-3 py-2 rounded-md text-sm">
                {selectedReservation.name} ({selectedReservation.phone})
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Mensagem</label>
              <textarea 
                className="w-full bg-input px-3 py-2 rounded-md text-sm min-h-[120px]"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <button 
                onClick={() => setIsMessageModalOpen(false)}
                className="flex-1 py-2 text-sm font-semibold rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80"
              >
                Cancelar
              </button>
              <button 
                onClick={sendConfirmationMessage}
                className="flex-1 py-2 text-sm font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Enviar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};