@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
@Schema(name = "IsoRequestCdtr", description = "")
public class IsoRequestCdtr {
    @Schema(description = "Creditor's account number.", required = true)
    @JsonProperty("account")
    private String account;
    
    @Schema(description = "Creditor's BIC code. Must be a valid BIC format.", required = true)
    @JsonProperty("agent")
    private String agent;
    
    @Schema(description = "Creditor's name in English.", required = true)
    @JsonProperty("nameEn")
    private String nameEn;
    
    @Schema(description = "Creditor's name in Thai.", required = true)
    @JsonProperty("nameTh")
    private String nameTh;
    
    @Schema(description = "")
    @JsonProperty("addressInfo")
    private IsoRequestCdtrAddressInfo addressInfo;
    
}
