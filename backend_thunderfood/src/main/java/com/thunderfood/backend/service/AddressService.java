package com.thunderfood.backend.service;

import com.thunderfood.backend.dto.address.AddressResponse;
import com.thunderfood.backend.dto.address.CreateAddressRequest;
import com.thunderfood.backend.dto.address.ServiceWardResponse;

import java.util.List;

public interface AddressService {

    List<ServiceWardResponse> getActiveWards(String keyword, String type);

    AddressResponse createAddress(Long userId, CreateAddressRequest request);

    List<AddressResponse> getUserAddresses(Long userId);

    AddressResponse getDefaultAddress(Long userId);

    AddressResponse getAddressById(Long addressId, Long userId);

    AddressResponse updateAddress(Long addressId, Long userId, CreateAddressRequest request);

    AddressResponse setDefaultAddress(Long addressId, Long userId);

    void deleteAddress(Long addressId, Long userId);
}
