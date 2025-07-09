@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
@Schema(name = "IsoRequestDbtr", description = "")
public class IsoRequestDbtr {
    @Schema(description = "Debtor's account number.", required = true)
    @JsonProperty("account")
    private String account;
    
    @Schema(description = "Debtor's name in English.", required = true)
    @JsonProperty("nameEn")
    private String nameEn;
    
    @Schema(description = "Debtor's name in Thai.")
    @JsonProperty("nameTh")
    private String nameTh;
    
    @Schema(description = "Type of the debtor's identification card.")
    @JsonProperty("dbtrCardType")
    private String dbtrCardType;
    
    @Schema(description = "Debtor's identification card number.")
    @JsonProperty("dbtrCardNo")
    private String dbtrCardNo;
    
    @Schema(description = "Debtor's date of birth.")
    @JsonProperty("dbtrDateOfBirth")
    private LocalDate dbtrDateOfBirth;
    
    @Schema(description = "Debtor's place of birth.")
    @JsonProperty("dbtrBirthPlace")
    private String dbtrBirthPlace;
    
    @Schema(description = "Debtor's birth country in ISO format.")
    @JsonProperty("dbtrBirthCountry")
    private String dbtrBirthCountry;
    
    @Schema(description = "")
    @JsonProperty("addressInfo")
    private IsoRequestDbtrAddressInfo addressInfo;
    
}
