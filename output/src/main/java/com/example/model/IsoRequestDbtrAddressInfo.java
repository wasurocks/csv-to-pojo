@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
@Schema(name = "IsoRequestDbtrAddressInfo", description = "")
public class IsoRequestDbtrAddressInfo {
    @Schema(description = "Department name in the address.")
    @JsonProperty("addressDepartment")
    private String addressDepartment;
    
    @Schema(description = "Sub-department name in the address.")
    @JsonProperty("addressSubDepartment")
    private String addressSubDepartment;
    
    @Schema(description = "Street address of the debtor.")
    @JsonProperty("addressStreet")
    private String addressStreet;
    
    @Schema(description = "Building number of the debtor's address.")
    @JsonProperty("addressBuildingNo")
    private String addressBuildingNo;
    
    @Schema(description = "Building name of the debtor's address.")
    @JsonProperty("addressBuildingName")
    private String addressBuildingName;
    
    @Schema(description = "Floor number of the debtor's address.")
    @JsonProperty("addressFloor")
    private String addressFloor;
    
    @Schema(description = "Post box address of the debtor.")
    @JsonProperty("addressPostBox")
    private String addressPostBox;
    
    @Schema(description = "Room number of the debtor's address.")
    @JsonProperty("addressRoom")
    private String addressRoom;
    
    @Schema(description = "Debtor's postal code.")
    @JsonProperty("addressPostCode")
    private String addressPostCode;
    
    @Schema(description = "Town name of the debtor's address.")
    @JsonProperty("addressTownName")
    private String addressTownName;
    
    @Schema(description = "District name of the debtor's address.")
    @JsonProperty("addressDistrictName")
    private String addressDistrictName;
    
    @Schema(description = "Debtor's country code (ISO).")
    @JsonProperty("addressCountry")
    private String addressCountry;
    
    @Schema(description = "First address line of the debtor.")
    @JsonProperty("addressLine1")
    private String addressLine1;
    
    @Schema(description = "Second address line of the debtor.")
    @JsonProperty("addressLine2")
    private String addressLine2;
    
}
