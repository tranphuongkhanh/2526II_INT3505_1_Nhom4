package com.example.Rental.service;

import com.example.Rental.entity.RentalContract;
import com.example.Rental.entity.Room;
import com.example.Rental.entity.UtilityBill;
import com.example.Rental.enums.BillStatus;
import com.example.Rental.repository.RentalContractRepository;
import com.example.Rental.repository.UtilityBillRepository;
import com.example.Rental.repository.RoomRepository;
import com.example.Rental.enums.NotificationType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class UtilityBillService {

    private final UtilityBillRepository utilityBillRepository;
    private final RentalContractRepository rentalContractRepository;
    private final RoomRepository roomRepository;
    private final NotificationService notificationService;

    public UtilityBillService(UtilityBillRepository utilityBillRepository,
                              RentalContractRepository rentalContractRepository,
                              RoomRepository roomRepository,
                              NotificationService notificationService) {
        this.utilityBillRepository = utilityBillRepository;
        this.rentalContractRepository = rentalContractRepository;
        this.roomRepository = roomRepository;
        this.notificationService = notificationService;
    }

    public List<UtilityBill> listByContract(Long contractId) {
        return utilityBillRepository.findByContractIdOrderByBillingMonthDesc(contractId);
    }

    @Transactional
    public UtilityBill createMonthlyBill(Long contractId) {
        return createMonthlyBillWithMeters(contractId, LocalDate.now().withDayOfMonth(1), null, null, null, "");
    }

    @Transactional
    public UtilityBill createMonthlyBillWithMeters(Long contractId, LocalDate billingMonth,
                                                   Integer elecCurr, Integer waterCurr, java.math.BigDecimal extraFee, String extraNote) {
        RentalContract contract = rentalContractRepository.findById(contractId)
                .orElseThrow(() -> new IllegalArgumentException("Contract not found"));

        Room room = contract.getRoom();
        if (room == null) throw new IllegalArgumentException("Contract has no room");

        if (billingMonth == null) billingMonth = LocalDate.now().withDayOfMonth(1);

        Optional<UtilityBill> existing = utilityBillRepository.findByContractIdAndBillingMonth(contractId, billingMonth);
        if (existing.isPresent()) return existing.get();

        // Determine previous readings
        int lastElec = 0;
        int lastWater = 0;
        List<UtilityBill> bills = utilityBillRepository.findByContractIdOrderByBillingMonthDesc(contractId);
        if (!bills.isEmpty()) {
            UtilityBill last = bills.get(0);
            lastElec = last.getElecCurr();
            lastWater = last.getWaterCurr();
        }

        int elecCurrVal = (elecCurr != null) ? elecCurr : lastElec + 50;
        int waterCurrVal = (waterCurr != null) ? waterCurr : lastWater + 10;

        int elecUsage = Math.max(0, elecCurrVal - lastElec);
        int waterUsage = Math.max(0, waterCurrVal - lastWater);

        java.math.BigDecimal elecPrice = contract.getElectricityPrice() != null ? contract.getElectricityPrice() : new java.math.BigDecimal("3000");
        java.math.BigDecimal waterPrice = contract.getWaterPrice() != null ? contract.getWaterPrice() : new java.math.BigDecimal("15000");

        java.math.BigDecimal elecAmount = elecPrice.multiply(java.math.BigDecimal.valueOf(elecUsage));
        java.math.BigDecimal waterAmount = waterPrice.multiply(java.math.BigDecimal.valueOf(waterUsage));
        java.math.BigDecimal rentAmount = contract.getMonthlyRent() != null ? contract.getMonthlyRent() : java.math.BigDecimal.ZERO;

        java.math.BigDecimal extra = (extraFee != null) ? extraFee : java.math.BigDecimal.ZERO;
        java.math.BigDecimal total = elecAmount.add(waterAmount).add(rentAmount).add(extra);

        UtilityBill bill = UtilityBill.builder()
                .contract(contract)
                .room(room)
                .billingMonth(billingMonth)
                .elecPrev(lastElec)
                .elecCurr(elecCurrVal)
                .elecUsage(elecUsage)
                .elecUnitPrice(elecPrice)
                .elecAmount(elecAmount)
                .waterPrev(lastWater)
                .waterCurr(waterCurrVal)
                .waterUsage(waterUsage)
                .waterUnitPrice(waterPrice)
                .waterAmount(waterAmount)
                .rentAmount(rentAmount)
                .extraFee(extra)
                .extraNote(extraNote)
                .totalAmount(total)
                .status(BillStatus.UNPAID)
                .build();

        UtilityBill savedBill = utilityBillRepository.save(bill);

        // Gửi thông báo WebSocket realtime về hóa đơn mới cho Renter
        notificationService.createAndSendNotification(
                contract.getRenter(),
                NotificationType.NEW_BILL,
                "Hóa đơn dịch vụ mới",
                "Bạn có hóa đơn điện nước mới tháng " + billingMonth + " cho phòng '" + room.getTitle() + "'. Tổng tiền: " + total + " VND.",
                "bill",
                savedBill.getId()
        );

        return savedBill;
    }

    public UtilityBill getById(Long billId) {
        return utilityBillRepository.findById(billId)
                .orElseThrow(() -> new IllegalArgumentException("Bill not found"));
    }

    @Transactional
    public UtilityBill markPaid(Long billId) {
        UtilityBill bill = getById(billId);
        bill.setStatus(BillStatus.PAID);
        bill.setPaidAt(java.time.LocalDateTime.now());
        return utilityBillRepository.save(bill);
    }
}
